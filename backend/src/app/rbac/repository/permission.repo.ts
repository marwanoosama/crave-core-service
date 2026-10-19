import { Knex } from "knex";
import { db } from "../../../lib/knex/knex";
import { Permission } from "../entity/permission.entity";

function toEntity(row: any): Permission {
    return new Permission({
        id: row.id,
        resource: row.resource,
        action: row.action,
        createdAt: row.created_at,
    });
}

export async function getPermissionsByRoleName(roleName: string, trx?: Knex.Transaction): Promise<string[]> {
    const query = trx || db;
    const rows = await query("permissions as p")
        .select("p.id", "p.resource", "p.action", "p.created_at")
        .join("role_permissions as rp", "p.id", "rp.permission_id")
        .join("roles as r", "rp.role_id", "r.id")
        .where("r.name", roleName);

    return rows.map(row => {
        const entity = toEntity(row);
        return `${entity.resource}:${entity.action}`; // core:product:create
    });
}

export async function getPermissionsDetailsByRoleName(roleName: string, conn: Knex = db){
    const query = conn || db;
    const rows = await query("permissions as p")
        .select("p.resource as resource", "p.action as action")
        .join("role_permissions as rp", "rp.permission_id", "p.id")
        .join("roles as r", "r.id", "rp.role_id")
        .where("r.name", roleName)

    return rows.map(row => ({permission: `${row.resource}:${row.action}`}));
}
