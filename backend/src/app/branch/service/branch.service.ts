import {CreateBranchDTO, UpdateBranchDTO, UpdateBranchStatusDTO} from "../dto/branch.dto";
import {SystemRole} from "../../user/enums";
import {findById} from "../../restaurant/repository/restaurant.repo";
import {RestaurantNotFoundError, UnAuthorizedError} from "../../restaurant/errors";
import {
    createBranch,
    findBranchById,
    findBranchesByRestaurant,
    findNearbyBranches,
    updateBranch,
    updateBranchStatus
} from "../repository/branch.repository";
import {BranchNotFoundError} from "../errors";
import {injectable} from "tsyringe";
import {buildPaginationResult, FilterParams, PaginationParams} from "../../../lib/http/pagination/cursor-pagination";
import {db} from "../../../lib/knex/knex";
import {insertOutboxEvent} from "../../../lib/events/outbox.repo";
import {EVENT_TYPES} from "../../../lib/events/event-types";
import {BranchWithRestaurant} from "../types";

@injectable()
export class BranchService{

    findNearby = async (lat:number, lng:number, params: PaginationParams, filters: FilterParams[]) => {
        const result = await findNearbyBranches(lat, lng, params, filters);
        return buildPaginationResult(result, params.limit, params.sortBy);
    }

    findByRestaurant = async function(restaurantId: number){
        return await findBranchesByRestaurant(restaurantId);
    }

    findByIdWithRestaurant = async (branchId: number): Promise<BranchWithRestaurant | null> => {
        const branch = await findBranchById(branchId);
        if (!branch) return null;

        const restaurant = await findById(branch.restaurantId);
        return {
            branch,
            restaurantStatus: restaurant?.status ?? "unknown",
        };
    }

    create = async function(restaurantId: number, data: CreateBranchDTO, userId: number, role: SystemRole){
        const restaurant = await findById(restaurantId);
        if(restaurant == undefined){
            throw RestaurantNotFoundError;
        }

        if(role !== SystemRole.SYSTEM_ADMIN && Number(userId) !== Number(restaurant.ownerId)){
            throw UnAuthorizedError;
        }

        const now = new Date();
        return await createBranch({
            restaurantId: restaurantId,
            label: data.label,
            countryCode: data.countryCode,
            lat: data.lat,
            lng: data.lng,
            addressText: data.addressText,
            isActive: false,
            opensAt: data.opensAt,
            closesAt: data.closesAt,
            currency: data.currency,
            deliveryRadius: data.deliveryRadius,
            commission: 0,
            createdAt: now,
            updatedAt: now,
            acceptOrders: true,
        });
    }

    update = async (branchId: number, userId: number, userRole: SystemRole, data: UpdateBranchDTO) => {
        const branch = await findBranchById(branchId);
        if (!branch) {
            throw BranchNotFoundError;
        }

        const restaurant = await findById(branch.restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorizedError;
        }

        const trx = await db.transaction();
        try {
            const updated = await updateBranch(branchId, data, trx);
            await insertOutboxEvent(trx, {
                aggregateType: "restaurant_branches",
                aggregateId: branchId,
                eventType: EVENT_TYPES.BRANCH_UPDATED,
                payload: {branchId},
            });
            await trx.commit();
            return updated;
        } catch (err) {
            await trx.rollback();
            throw err;
        }
    }

    updateStatus = async (branchId: number, userRole: SystemRole, data: UpdateBranchStatusDTO) => {
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorizedError;
        }

        const branch = await findBranchById(branchId);
        if (!branch) {
            throw BranchNotFoundError;
        }

        const trx = await db.transaction();
        try {
            const updated = await updateBranchStatus(branchId, data, trx);
            const eventType = data.isActive === false
                ? EVENT_TYPES.BRANCH_DEACTIVATED
                : EVENT_TYPES.BRANCH_UPDATED;
            await insertOutboxEvent(trx, {
                aggregateType: "restaurant_branches",
                aggregateId: branchId,
                eventType,
                payload: {branchId},
            });
            await trx.commit();
            return updated;
        } catch (err) {
            await trx.rollback();
            throw err;
        }
    }
}
