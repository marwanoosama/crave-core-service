import type { Knex } from "knex";

// order-service implementation plan §0.5.4: transactional outbox.
// Service layers insert rows in the same DB transaction as domain writes
// (via insertOutboxEvent); a separate worker process drains unpublished
// rows to the broker. select-for-update-skip-locked claiming keeps N
// workers safe in parallel.
export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE TABLE events_outbox (
            id BIGSERIAL PRIMARY KEY,
            aggregate_type TEXT NOT NULL,
            aggregate_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            event_id UUID NOT NULL UNIQUE,
            payload JSONB NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            dispatched_at TIMESTAMP,
            attempts INT NOT NULL DEFAULT 0,
            last_error TEXT
        );

        CREATE INDEX idx_events_outbox_pending ON events_outbox (id)
        WHERE dispatched_at IS NULL;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DROP TABLE IF EXISTS events_outbox;
    `);
}
