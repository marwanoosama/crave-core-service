import type {Knex} from "knex";
import {db} from "../../../lib/knex/knex";
import {ProductBranchDetails} from "../entity/product-branch-details.entity";
import {ReserveStockApplied} from "../types";

const PBD_COLUMNS = ['id', 'branch_id', 'product_id', 'price', 'stock', 'is_available'];

function toEntity(row: any): ProductBranchDetails {
    return new ProductBranchDetails({
        id: row.id,
        branchId: row.branch_id,
        productId: row.product_id,
        price: row.price,
        stock: row.stock,
        isAvailable: row.is_available,
    });
}

export async function updateBranchDetails(
    branchId: number,
    productId: number,
    data: {price?: number; stock?: number; isAvailable?: boolean},
    conn: Knex = db,
): Promise<ProductBranchDetails> {
    const [row] = await conn("product_branch_details")
        .where("branch_id", branchId)
        .where("product_id", productId)
        .update({
            price: data.price,
            stock: data.stock,
            is_available: data.isAvailable,
        })
        .returning(PBD_COLUMNS);
    return toEntity(row);
}

export async function lockBranchDetails(
    trx: Knex.Transaction,
    branchId: number,
    productIds: number[],
): Promise<ProductBranchDetails[]> {
    const rows = await trx("product_branch_details")
        .where("branch_id", branchId)
        .whereIn("product_id", productIds)
        .select(PBD_COLUMNS)
        .forUpdate();
    return rows.map(toEntity);
}

export async function bulkUpdateStock(
    trx: Knex.Transaction,
    branchId: number,
    applied: ReserveStockApplied[],
): Promise<void> {
    if (applied.length === 0) return;
    const placeholders = applied.map(() => "(?, ?)").join(",");
    const bindings: (number | string)[] = [];
    for (const a of applied) bindings.push(a.productId, a.newStock);
    bindings.push(branchId);
    // Casts are required: parameters inside VALUES default to `text`, which
    // breaks `pbd.product_id (bigint) = v.product_id` and `SET stock (int) = v.new_stock`.
    await trx.raw(
        `UPDATE product_branch_details AS pbd
         SET stock = v.new_stock::int
         FROM (VALUES ${placeholders}) AS v(product_id, new_stock)
         WHERE pbd.branch_id = ? AND pbd.product_id = v.product_id::bigint`,
        bindings,
    );
}
