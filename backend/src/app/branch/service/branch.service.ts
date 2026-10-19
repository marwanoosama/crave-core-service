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

@injectable()
export class BranchService{

    findNearby = async (lat:number, lng:number) => {
        return await findNearbyBranches(lat, lng);
    }

    findByRestaurant = async function(restaurantId: number){
        return await findBranchesByRestaurant(restaurantId);
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

        return await updateBranch(branchId, data);
    }

    updateStatus = async (branchId: number, userRole: SystemRole, data: UpdateBranchStatusDTO) => {
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorizedError;
        }

        const branch = await findBranchById(branchId);
        if (!branch) {
            throw BranchNotFoundError;
        }

        return await updateBranchStatus(branchId, data);
    }
}
