import * as amqp from 'amqplib';
import {env} from '../config/env';
import {db} from '../knex/knex';
import {Logger} from '../logger/logger';

const logger = new Logger();

// Drains unpublished rows out of events_outbox onto the `core.events`
// topic exchange. Claiming uses FOR UPDATE SKIP LOCKED so N workers can
// run in parallel; publishing uses a confirm channel and stamps
// dispatched_at only after the broker acknowledges. A row whose publish
// failed stays undispatched (attempts++, last_error) and is retried.

const MAX_ATTEMPTS = 50;

interface OutboxRow {
    id: number;
    event_type: string;
    event_id: string;
    payload: unknown;
    created_at: Date;
}

let amqpConn: amqp.ChannelModel | null = null;
let confirmChannel: amqp.ConfirmChannel | null = null;

/** Connection/channel lifecycle: reset on error, re-created lazily on the next drain run. */
function invalidateChannel() {
    confirmChannel = null;
}

export async function connectOutboxPublisher(): Promise<void> {
    // the 'close' handler nulls amqpConn, so a non-null field means usable
    if (amqpConn) {
        return;
    }
    amqpConn = await amqp.connect(env.rabbitmq.url);
    amqpConn.on('error', () => {
        invalidateChannel();
    });
    amqpConn.on('close', () => {
        amqpConn = null;
        confirmChannel = null;
    });
    await declareExchange();
}

export async function declareExchange(): Promise<void> {
    const ch = await amqpConn!.createChannel();
    await ch.assertExchange(env.rabbitmq.coreEventsExchange, 'topic', {durable: true});
    await ch.close();
}

async function getConfirmChannel(): Promise<amqp.ConfirmChannel> {
    if (confirmChannel) {
        return confirmChannel;
    }
    await connectOutboxPublisher();
    confirmChannel = await amqpConn!.createConfirmChannel();
    return confirmChannel;
}

export async function closeOutboxPublisher(): Promise<void> {
    if (confirmChannel) {
        await confirmChannel.close().catch(() => undefined);
        confirmChannel = null;
    }
    if (amqpConn) {
        await amqpConn.close().catch(() => undefined);
        amqpConn = null;
    }
}

function rowToEnvelope(row: OutboxRow) {
    return JSON.stringify({
        eventId: row.event_id,
        eventType: row.event_type,
        occurredAt: new Date(row.created_at).toISOString(),
        payload: row.payload,
    });
}

async function markDispatched(id: number) {
    await db('events_outbox')
        .where({id})
        .update({dispatched_at: db.fn.now(), last_error: null});
}

async function markFailed(row: OutboxRow, err: unknown) {
    await db('events_outbox')
        .where({id: row.id})
        .update({last_error: String(err instanceof Error ? err.message : err)});
}

async function claimBatch(size: number): Promise<OutboxRow[]> {
    const rows = await db.transaction(async (trx) => {
        const claimed = await trx.raw(
            `UPDATE events_outbox
             SET attempts = attempts + 1
             WHERE id IN (
                 SELECT id FROM events_outbox
                 WHERE dispatched_at IS NULL AND attempts < ?
                 ORDER BY id
                 LIMIT ?
                 FOR UPDATE SKIP LOCKED
             )
             RETURNING id, event_type, event_id, payload, created_at`,
            [MAX_ATTEMPTS, size],
        );
        return claimed.rows as OutboxRow[];
    });
    return rows;
}

export async function drainOutbox(): Promise<number> {
    const rows = await claimBatch(env.outbox.batchSize);
    if (rows.length === 0) {
        return 0;
    }

    let published = 0;
    let ch: amqp.ConfirmChannel;
    try {
        ch = await getConfirmChannel();
    } catch (err) {
        logger.error(`outbox publisher not reachable: ${err instanceof Error ? err.message : err}`);
        process.exitCode = 1;
        return 0;
    }

    for (const row of rows) {
        try {
            ch.publish(
                env.rabbitmq.coreEventsExchange,
                row.event_type,
                Buffer.from(rowToEnvelope(row)),
                {persistent: true, contentType: 'application/json'},
            );
            // resolves-and-throws once the broker confirms (or nacks) the publish
            await ch.waitForConfirms();
            await markDispatched(row.id);
            published++;
        } catch (err) {
            await markFailed(row, err);
            invalidateChannel();
        }
    }
    return published;
}
