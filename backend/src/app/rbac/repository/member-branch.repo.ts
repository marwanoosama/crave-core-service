import {MemberBranch} from "../entity/member-branch.entity";
import {Knex} from "knex";
import {db} from "../../../common/knex/knex";

// const MEMBER_COLUMNS = [
//     "id", "restaurant_id", "user_id", "role_id", "status", "created_at", "updated_at"
// ]

function toEntity(row: any){
    return new MemberBranch({
        memberId: row.member_id,
        branchId: row.branch_id,
        createdAt: row.created_at
    });
}

export async function setMemberBranches(memberId: number, rows: MemberBranch[], trx?: Knex.Transaction){
    const query = trx || db;
    await query("member_branches").where("member_id", memberId).delete();

    if(rows.length > 0){
        await query("member_branches").insert(rows.map(row => ({
            member_id: row.memberId,
            branch_id: row.branchId,
            created_at: row.createdAt,
        })));
    }
}

export async function findBranchIdsByMemberId(memberId: number): Promise<number[]> {
    const rows = await db("member_branches").select("branch_id").where("member_id", memberId);
    return rows?.map(row => row.branch_id); // [{branch_id:2}, {branch_id:3}] -> [2,3]
}