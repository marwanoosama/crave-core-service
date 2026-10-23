import 'reflect-metadata';
import {Cron} from 'croner';
import {env} from './lib/config/env.js';
import {db} from './lib/knex/knex.js';
import {drainOutbox, connectOutboxPublisher, closeOutboxPublisher} from './lib/events/drain.js';
import {Logger} from './lib/logger/logger.js';

// Separate worker process (not the API): schedules drainOutbox() on
// env.outbox.drainCron and declares the core.events topic exchange at boot.
// SKIP LOCKED claiming makes N workers safe in parallel.

const logger = new Logger();

let running = false;

async function runDrain() {
    if (running) {
        return; // never overlap runs
    }
    running = true;
    try {
        const published = await drainOutbox();
        if (published > 0) {
            logger.info(`outbox drained`, {published});
        }
    } catch (err) {
        logger.error('outbox drain failed', {error: err instanceof Error ? err.message : err});
    } finally {
        running = false;
    }
}

async function main() {
    await connectOutboxPublisher();
    logger.info(`outbox worker started, exchange ${env.rabbitmq.coreEventsExchange}, cron "${env.outbox.drainCron}", batch ${env.outbox.batchSize}`);

    new Cron(env.outbox.drainCron, runDrain);
    await runDrain(); // drain immediately at boot (catches events queued while down)
}

async function shutDown() {
    await closeOutboxPublisher();
    await db.destroy();
    logger.info('outbox worker shut down');
    process.exit(0);
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

main().catch(err => {
    logger.error('outbox worker failed to start', {error: err instanceof Error ? err.message : err});
    process.exit(1);
});
