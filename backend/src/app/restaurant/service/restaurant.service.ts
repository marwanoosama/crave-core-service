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
import {findUserExistsByEmailOrPhone} from "../../user/repository/users.repo";
import {UserService} from "../../user/service/user.service";
import {RestaurantMemberService} from "../../rbac/service/restaurant-member.service";
import {CreateRestaurantDTO, UpdateRestaurantDTO, UpdateRestaurantStatusDTO} from "../dto/restaurant.dto";
import {db} from "../../../lib/knex/knex";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {buildPaginationResult, FilterParams, PaginationParams} from "../../../lib/http/pagination/cursor-pagination";
import {insertOutboxEvent} from "../../../lib/events/outbox.repo";
import {EVENT_TYPES} from "../../../lib/events/event-types";

@injectable()
export class RestaurantService{
    constructor(
        @inject(TOKENS.UserService) private readonly userService: UserService,
        @inject(TOKENS.RestaurantMemberService) private readonly memberService: RestaurantMemberService,
    ) {}

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

        const now = new Date();
        const trx = await db.transaction();

        try {
            const user = await this.userService.create({
                email: data.owner.email,
                phone: data.owner.phone,
                name: data.owner.name,
                password: data.owner.password,
                systemRole: SystemRole.RESTAURANT_USER,
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

            await this.memberService.createOwnerMember(restaurant.id, user.id, trx);

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

    findAll = async(params: PaginationParams, filters: FilterParams[]) => {
        const result = await findAll(params, filters);
        return buildPaginationResult(result, params.limit, params.sortBy);
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

        if(role !== SystemRole.SYSTEM_ADMIN && Number(userId) !== Number(restaurant.ownerId)){
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

        const trx = await db.transaction();
        try {
            const updated = await updateRestaurantStatus(id, data.status, trx);

            if (data.status === RestaurantStatus.SUSPENDED) {
                await insertOutboxEvent(trx, {
                    aggregateType: "restaurants",
                    aggregateId: id,
                    eventType: EVENT_TYPES.RESTAURANT_SUSPENDED,
                    payload: {restaurantId: id},
                });
            }

            await trx.commit();
            return updated;
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }
}
