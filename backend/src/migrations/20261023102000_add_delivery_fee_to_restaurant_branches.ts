import type { Knex } from "knex";

// order-service implementation plan §0.5.2: branch-level delivery fee in
// minor units of the branch currency; order-service reads it via
// `GET /api/internal/branches/:id` at checkout (endpoint lands in Phase 1).
export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE restaurant_branches
        ADD COLUMN IF NOT EXISTS delivery_fee INT NOT NULL DEFAULT 0;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE restaurant_branches
        DROP COLUMN IF EXISTS delivery_fee;
    `);
}
