import {RegisterRestaurantDTO} from "../../auth/dto/auth.dto";
import {
    createRestaurant,
    findAll,
    findById,
    updateRestaurant,
    updateRestaurantStatus
} from "../repository/restaurant.repo";
import {Restaurant} from "../entity/restaurant.entity";
import {RestaurantStatus} from "../enums";
import {Knex} from "knex";
import {OwnerAlreadyExistsError, RestaurantNotFoundError, UnAuthorizedError} from "../errors";
import {SystemRole} from "../../user/enums";
import {createUser, findUserExistsByEmailOrPhone} from "../../user/repository/users.repo";
import {hashPassword} from "../../auth/utils";
import {CreateRestaurantDTO, UpdateRestaurantDTO, UpdateRestaurantStatusDTO} from "../dto/restaurant.dto";
import {db} from "../../../common/knex/knex";

export class RestaurantService{
    create= async (userId: number, data: RegisterRestaurantDTO, trx: Knex) => {
        const now = new Date();

        const restaurant = new Restaurant({
            ownerId: userId,
            name: data.name,
            logoURL: data.logoUrl,
            primaryCountry: data.primaryCountry,
            status: RestaurantStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            statusUpdatedAt: now,
        });

        return await createRestaurant(restaurant, trx);
    }

    createWithOwner = async (userRole: SystemRole, data: CreateRestaurantDTO) => {
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorizedError;
        }

        const existing = await findUserExistsByEmailOrPhone(data.owner.email, data.owner.phone);
        if (existing) {
            throw OwnerAlreadyExistsError;
        }

        const hashedPassword = await hashPassword(data.owner.password);
        const now = new Date();
        const trx = await db.transaction();

        try {
            const user = await createUser({
                email: data.owner.email,
                phone: data.owner.phone,
                name: data.owner.name,
                passwordHash: hashedPassword,
                systemRole: SystemRole.RESTAURANT_USER,
                createdAt: now,
                updatedAt: now,
            }, trx);

            const restaurant = await createRestaurant(new Restaurant({
                ownerId: user.id,
                name: data.name,
                logoURL: data.logoUrl ?? "",
                primaryCountry: data.primaryCountry,
                status: RestaurantStatus.ACTIVE,
                createdAt: now,
                updatedAt: now,
                statusUpdatedAt: now,
            }), trx);

            await trx.commit();

            return {
                restaurant,
                owner: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    name: user.name,
                    systemRole: user.systemRole,
                },
            };
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    findAll = async() => {
        return await findAll();
    }

    getById = async(id: number) => {
        const restaurant = await findById(id);
        if(restaurant == undefined){
            throw RestaurantNotFoundError;
        }

        return restaurant;
    }

    update = async(id: number, data: UpdateRestaurantDTO, role: SystemRole, userId: number) => {
        const restaurant = await findById(id);
        if(restaurant == undefined){
            throw RestaurantNotFoundError;
        }

        if(role !== SystemRole.SYSTEM_ADMIN && userId !== restaurant.ownerId){
            throw UnAuthorizedError;
        }

        return await updateRestaurant(id, data);
    }

    updateStatus = async(id: number, data: UpdateRestaurantStatusDTO, role: SystemRole) => {
        const restaurant = await findById(id);
        if(restaurant == undefined){
            throw RestaurantNotFoundError;
        }

        if(role !== SystemRole.SYSTEM_ADMIN){
            throw UnAuthorizedError;
        }

        return await updateRestaurantStatus(id, data.status);
    }
}

export const restaurantService = new RestaurantService();