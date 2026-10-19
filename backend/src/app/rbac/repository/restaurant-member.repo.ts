import {RestaurantMember} from "../entity/restaurant-member.entity";
import {Knex} from "knex";
import {db} from "../../../lib/knex/knex";
import {MemberStatus} from "../enums";

const MEMBER_COLUMNS = [
    "id", "restaurant_id", "user_id", "role_id", "status", "created_at", "updated_at"
]

function toEntity(row: any){
    return new RestaurantMember({
       id: row.id,
       restaurantId: row.restaurant_id,
       userId: row.user_id,
       roleId: row.role_id,
       status: row.status,
       createdAt: row.created_at,
       updatedAt: row.updated_at
    });
}

export async function createRestaurantMember(data: Partial<RestaurantMember>, conn: Knex = db){
    const query = conn || db;
    const [row] = await query("restaurant_members").insert({
        restaurant_id: data.restaurantId,
        user_id: data.userId,
        role_id: data.roleId,
        status: data.status,
        created_at: data.createdAt,
        updated_at: data.updatedAt
    }).returning(MEMBER_COLUMNS);

    return toEntity(row);
}

export async function activateMemberByUserId(userId: number, conn: Knex = db){
    const query = conn || db;
    await query("restaurant_members")
        .where("user_id", userId)
        .update({status: MemberStatus.ACTIVE, updated_at: new Date()});
}

export async function updateRestaurantMember(memberId: number, data: {roleId?: number; status?: string}, conn: Knex = db){
    const updateData: any = {updated_at: new Date()};
    if (data.roleId !== undefined) updateData.role_id = data.roleId;
    if (data.status !== undefined) updateData.status = data.status;
    await conn("restaurant_members").where("id", memberId).update(updateData);
}

export async function deleteRestaurantMember(memberId: number, conn: Knex = db){
    const query = conn || db;
    return query.transaction(async (trx) => {
        await trx("member_branches").where("member_id", memberId).delete();
        return trx("restaurant_members").where("id", memberId).delete();
    });
}

export async function findRestaurantMemberWithRole(userId: number): Promise<{member: RestaurantMember; roleName:string;}> {
    const row = await db("restaurant_members as rm").select(
        ...MEMBER_COLUMNS.map(column => `rm.${column}`),
        "r.name as roleName"
    ).leftJoin("roles as r","rm.role_id","r.id")
        .where("rm.user_id", userId)
        .andWhere("rm.status",MemberStatus.ACTIVE).first();
    return {
        member: toEntity(row),
        roleName: row.roleName,
    };
}

export async function findRestaurantMembersByRestaurantId(restaurantId: number, conn: Knex = db){
    const query = conn || db;

    const rows = await query("restaurant_members as rm").select(
        "rm.id as id",
        "rm.status as status",
        "u.id as user_id",
        "u.email as email",
        "u.name as name",
        "u.phone as phone",
        "r.name as role",
        "r.display_name as role_display_name"

    )
        .innerJoin("users as u", "rm.user_id", "u.id")
        .innerJoin("roles as r", "rm.role_id", "r.id")
        .where("rm.restaurant_id", restaurantId)
        .orderBy("rm.id");

    return rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        email: row.email,
        name: row.name,
        phone: row.phone,
        role: row.role,
        roleDisplayName: row.role_display_name,
        status: row.status
    }));
}

export async function findRestaurantMemberWithRoleName(memberId: number, conn: Knex = db){
    const query = conn || db;

    const row = await query("restaurant_members as rm")
        .select(...MEMBER_COLUMNS.map(column => `rm.${column}`), "r.name as role_name")
        .innerJoin("roles as r", "rm.role_id", "r.id")
        .where("rm.id", memberId)
        .first();

    if (!row) return null;
    return {
        member: toEntity(row),
        roleName: row.role_name
    };
}