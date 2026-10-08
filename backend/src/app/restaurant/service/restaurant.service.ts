import {RegisterRestaurantDTO} from "../../auth/dto/auth.dto";
import {createRestaurant, findAll} from "../repository/restaurant.repo";
import {Restaurant} from "../entity/restaurant.entity";
import {RestaurantStatus} from "../enums";
import {Knex} from "knex";

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

    findAll = async() => {
        return await findAll();
    }
}

export const restaurantService = new RestaurantService();