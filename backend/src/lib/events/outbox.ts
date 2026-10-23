import type {Knex} from 'knex';
import {v4 as uuid} from 'uuid';

// Transactional outbox: service layers call insertOutboxEvent with the SAME
// knex trx as the domain write, so the event and the mutation commit
// atomically. Repos never call this — collecting into the outbox is a
// service-layer concern. Drain runs in src/worker.ts.

export interface OutboxEventInput {
    aggregateType: string;
    aggregateId: number | string;
    /** routing key published on the core.events topic exchange */
    eventType: string;
    payload: Record<string, unknown>;
}

export interface OutboxEventRow {
    id: number;
    aggregateType: string;
    aggregateId: number | string;
    eventType: string;
    eventId: string;
    payload: Record<string, unknown>;
    createdAt: Date;
    dispatchedAt: Date | null;
    attempts: number;
    lastError: string | null;
}

export async function insertOutboxEvent(
    trx: Knex.Transaction,
    input: OutboxEventInput,
): Promise<OutboxEventRow> {
    const [row] = await trx('events_outbox')
        .insert({
            aggregate_type: input.aggregateType,
            aggregate_id: input.aggregateId,
            event_type: input.eventType,
            event_id: uuid(),
            payload: JSON.stringify(input.payload),
            created_at: trx.fn.now(),
        })
        .returning([
            'id',
            'aggregate_type as aggregateType',
            'aggregate_id as aggregateId',
            'event_type as eventType',
            'event_id as eventId',
            'payload',
            'created_at as createdAt',
            'dispatched_at as dispatchedAt',
            'attempts',
            'last_error as lastError',
        ]);
    return row;
}
