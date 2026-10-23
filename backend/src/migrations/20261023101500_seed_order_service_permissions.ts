import type { Knex } from "knex";

// order-service implementation plan §0.5.1: seed the permissions the
// order-service RBAC checks, plus role mappings. `payments:refund` and
// `finance:payout_create` are admin-bypassed today; seeded for
// future extensibility.
export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        INSERT INTO permissions (resource, action, created_at) VALUES
          -- Orders
          ('orders', 'read', NOW()),
          ('orders', 'accept', NOW()),
          ('orders', 'update', NOW()),
          ('orders', 'cancel', NOW()),
          -- Payments
          ('payments', 'read', NOW()),
          ('payments', 'refund', NOW()),
          -- Deliveries (admin-only)
          ('deliveries', 'assign', NOW()),
          -- Finance
          ('finance', 'read', NOW()),
          ('finance', 'payout_create', NOW())
        ON CONFLICT (resource, action) DO NOTHING;
    `);

    // owner gets all of the above
    await knex.raw(`
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        SELECT r.id, p.id, NOW()
        FROM roles r, permissions p
        WHERE r.name = 'owner'
          AND (p.resource, p.action) IN (
            ('orders', 'read'),
            ('orders', 'accept'),
            ('orders', 'update'),
            ('orders', 'cancel'),
            ('payments', 'read'),
            ('payments', 'refund'),
            ('deliveries', 'assign'),
            ('finance', 'read'),
            ('finance', 'payout_create')
          )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    `);

    await knex.raw(`
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        SELECT r.id, p.id, NOW()
        FROM roles r, permissions p
        WHERE r.name = 'branch_manager'
          AND (p.resource, p.action) IN (
            ('orders', 'read'),
            ('orders', 'accept'),
            ('orders', 'update'),
            ('orders', 'cancel'),
            ('finance', 'read')
          )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    `);

    await knex.raw(`
        INSERT INTO role_permissions (role_id, permission_id, created_at)
        SELECT r.id, p.id, NOW()
        FROM roles r, permissions p
        WHERE r.name = 'staff'
          AND (p.resource, p.action) IN (
            ('orders', 'read'),
            ('orders', 'update'),
            ('orders', 'accept')
          )
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions
            WHERE (resource, action) IN (
                ('orders', 'read'),
                ('orders', 'accept'),
                ('orders', 'update'),
                ('orders', 'cancel'),
                ('payments', 'read'),
                ('payments', 'refund'),
                ('deliveries', 'assign'),
                ('finance', 'read'),
                ('finance', 'payout_create')
            )
        );

        DELETE FROM permissions
        WHERE (resource, action) IN (
            ('orders', 'read'),
            ('orders', 'accept'),
            ('orders', 'update'),
            ('orders', 'cancel'),
            ('payments', 'read'),
            ('payments', 'refund'),
            ('deliveries', 'assign'),
            ('finance', 'read'),
            ('finance', 'payout_create')
        );
    `);
}
