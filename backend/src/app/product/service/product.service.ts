import {RestaurantNotFoundError, UnAuthorizedError} from "../../restaurant/errors";
import {ProductNotFoundError, InvalidReserveItemsError, outOfStockError} from "../errors";
import {SystemRole} from "../../user/enums";
import {CreateProductDTO, UpdateProductDTO} from "../dto/product.dto";
import {
    BranchProductRow,
    OutOfStockItem,
    ReserveStockApplied,
    ReserveStockInput,
    ReserveStockResult,
} from "../types";
import {insertOutboxEvent} from "../../../lib/events/outbox.repo";
import {EVENT_TYPES} from "../../../lib/events/event-types";
import {createProduct, findProductById, findProductsByBranch, findProductsByRestaurant, updateProduct} from "../repository/product.repository";
import {findCategoryByName, findCategoriesByRestaurant, createCategory} from "../repository/category.repository";
import {updateBranchDetails} from "../repository/product-branch-details.repository";
import {findById} from "../../restaurant/repository/restaurant.repo";
import {db} from "../../../lib/knex/knex";
import {injectable} from "tsyringe";

@injectable()
export class ProductService {

    create = async (restaurantId: number, userId: number, userRole: SystemRole, data: CreateProductDTO) => {
        const restaurant = await findById(restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorizedError;
        }

        const trx = await db.transaction();
        try{
            let categoryId: number | null = null;
            if (data.categoryName) {
                let category = await findCategoryByName(restaurantId, data.categoryName, trx);
                if (!category) {
                    category = await createCategory(restaurantId, data.categoryName, trx);
                }
                categoryId = category.id;
            }

            const product = await createProduct({
                name: data.name,
                description: data.description,
                imageUrl: data.imageUrl,
                restaurantId,
                categoryId,
            }, trx);

            await trx.commit();

            return product;

        }catch(error){
            await trx.rollback();
            throw error;
        }
    }

    findByRestaurant = async (restaurantId: number, userId: number, userRole: SystemRole) => {
        const restaurant = await findById(restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorizedError;
        }
        return await findProductsByRestaurant(restaurantId);
    }

    findCategories = async (restaurantId: number) => {
        return await findCategoriesByRestaurant(restaurantId);
    }

    findByBranch = async (branchId: number) => {
        return await findProductsByBranch(branchId);
    }

    findById = async (id: number) => {
        const product = await findProductById(id);
        if (!product) {
            throw ProductNotFoundError;
        }
        return product;
    }

    update = async (productId: number, userId: number, userRole: SystemRole, data: UpdateProductDTO, branchId?: number) => {
        const product = await findProductById(productId);
        if (!product) {
            throw ProductNotFoundError;
        }

        const restaurant = await findById(product.restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorizedError;
        }

        const trx = await db.transaction();
        try {
            let categoryId: number | undefined = undefined;
            if (data.categoryName) {
                let category = await findCategoryByName(product.restaurantId, data.categoryName, trx);
                if (!category) {
                    category = await createCategory(product.restaurantId, data.categoryName, trx);
                }
                categoryId = category.id;
            }

            const updatedProduct = await updateProduct(productId, {
                name: data.name,
                description: data.description,
                imageUrl: data.imageUrl,
                categoryId,
            }, trx);

            let branchDetails;
            if (branchId && (data.price !== undefined || data.stock !== undefined || data.isAvailable !== undefined)) {
                branchDetails = await updateBranchDetails(branchId, productId, {
                    price: data.price,
                    stock: data.stock,
                    isAvailable: data.isAvailable,
                }, trx);

                if (data.price !== undefined) {
                    await insertOutboxEvent(trx, {
                        aggregateType: "product_branch_details",
                        aggregateId: `${branchId}:${productId}`,
                        eventType: EVENT_TYPES.PRODUCT_PRICE_CHANGED,
                        payload: {branchId, productId, newPrice: branchDetails.price},
                    });
                }

                if (data.stock !== undefined || data.isAvailable !== undefined) {
                    await insertOutboxEvent(trx, {
                        aggregateType: "product_branch_details",
                        aggregateId: `${branchId}:${productId}`,
                        eventType: EVENT_TYPES.PRODUCT_STOCK_CHANGED,
                        payload: {
                            branchId,
                            productId,
                            newStock: branchDetails.stock,
                            isAvailable: branchDetails.isAvailable,
                        },
                    });
                }
            }

            await trx.commit();

            return {product: updatedProduct, branchDetails};
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    findByBranchAndIds = async (branchId: number, productIds: number[]): Promise<BranchProductRow[]> => {
        if (productIds.length === 0) return [];

        const rows = await db("product_branch_details as pbd")
            .join("products as p", "p.id", "pbd.product_id")
            .where("pbd.branch_id", branchId)
            .whereIn("pbd.product_id", productIds)
            .whereNull("p.deleted_at")
            .select(
                "pbd.product_id",
                "p.name",
                "p.image_url",
                "pbd.price",
                "pbd.stock",
                "pbd.is_available",
            );

        return rows.map((row: any) => ({
            productId: row.product_id,
            name: row.name,
            imageUrl: row.image_url,
            price: row.price,
            stock: row.stock,
            isAvailable: row.is_available,
        }));
    }

    /**
     * Atomically increments branch stock for each item — reverse of reserveStock.
     * Used by order-service when an order placement fails after stock was
     * reserved (DB rollback, payment init failure). Unknown products are
     * skipped (release is best-effort). Writes product.stock.changed to the
     * outbox in the same trx.
     */
    releaseStock = async (branchId: number, items: ReserveStockInput[]): Promise<ReserveStockResult> => {
        const sanitized = items
            .map((item) => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity),
            }))
            .filter((item) => Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0);

        if (sanitized.length !== items.length) {
            throw InvalidReserveItemsError;
        }

        const productIds = sanitized.map((item) => item.productId);
        const trx = await db.transaction();

        try {
            const rows = await trx("product_branch_details")
                .where("branch_id", branchId)
                .whereIn("product_id", productIds)
                .select("product_id", "stock")
                .forUpdate();

            const byProduct = new Map<number, number>();
            for (const row of rows) {
                byProduct.set(Number(row.product_id), Number(row.stock));
            }

            // Compute the new stock per item; skip unknown products (release is best-effort).
            const applied: ReserveStockApplied[] = [];
            for (const item of sanitized) {
                const current = byProduct.get(item.productId);
                if (current === undefined) continue;
                applied.push({productId: item.productId, newStock: current + item.quantity});
            }

            for (const item of applied) {
                await trx("product_branch_details")
                    .where("branch_id", branchId)
                    .where("product_id", item.productId)
                    .update({stock: item.newStock});
            }

            for (const item of applied) {
                await insertOutboxEvent(trx, {
                    aggregateType: "product_branch_details",
                    aggregateId: `${branchId}:${item.productId}`,
                    eventType: EVENT_TYPES.PRODUCT_STOCK_CHANGED,
                    payload: {branchId, productId: item.productId, newStock: item.newStock},
                });
            }

            await trx.commit();
            return {ok: true, applied};
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    /**
     * Atomically decrements branch stock for each item. Locks the rows FOR UPDATE
     * and writes product.stock.changed to the outbox in the same trx so
     * order-service invalidates its cached price/stock projections.
     */
    reserveStock = async (branchId: number, items: ReserveStockInput[]): Promise<ReserveStockResult> => {
        const sanitized = items
            .map((item) => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity),
            }))
            .filter((item) => Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0);

        if (sanitized.length !== items.length) {
            throw InvalidReserveItemsError;
        }

        const productIds = sanitized.map((item) => item.productId);
        const trx = await db.transaction();

        try {
            const rows = await trx("product_branch_details")
                .where("branch_id", branchId)
                .whereIn("product_id", productIds)
                .select("product_id", "stock", "is_available")
                .forUpdate();

            const byProduct = new Map<number, {stock: number; isAvailable: boolean}>();
            for (const row of rows) {
                byProduct.set(Number(row.product_id), {
                    stock: row.stock,
                    isAvailable: row.is_available,
                });
            }

            const offending: OutOfStockItem[] = [];
            for (const item of sanitized) {
                const current = byProduct.get(item.productId);
                if (!current || !current.isAvailable) {
                    offending.push({productId: item.productId, requested: item.quantity, available: 0});
                    continue;
                }
                if (current.stock < item.quantity) {
                    offending.push({productId: item.productId, requested: item.quantity, available: current.stock});
                }
            }

            if (offending.length > 0) {
                throw outOfStockError(offending);
            }

            const applied: ReserveStockApplied[] = [];
            for (const item of sanitized) {
                const newStock = byProduct.get(item.productId)!.stock - item.quantity;
                await trx("product_branch_details")
                    .where("branch_id", branchId)
                    .where("product_id", item.productId)
                    .update({stock: newStock});
                applied.push({productId: item.productId, newStock});
            }

            for (const item of applied) {
                await insertOutboxEvent(trx, {
                    aggregateType: "product_branch_details",
                    aggregateId: `${branchId}:${item.productId}`,
                    eventType: EVENT_TYPES.PRODUCT_STOCK_CHANGED,
                    payload: {branchId, productId: item.productId, newStock: item.newStock},
                });
            }

            await trx.commit();
            return {ok: true, applied};
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }
}

