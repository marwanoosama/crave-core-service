import {NextFunction, Request, Response} from "express";
import {RestaurantService} from "../service/restaurant.service";
import {validateBody} from "../../../lib/validation/validation";
import {CreateRestaurantDTO, UpdateRestaurantDTO, UpdateRestaurantStatusDTO} from "../dto/restaurant.dto";
import {SystemRole} from "../../user/enums";
import {updateRestaurant} from "../repository/restaurant.repo";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendPaginated, sendSuccess} from "../../../lib/http/response";
import {parseFilters, parsePaginationQuery} from "../../../lib/http/pagination/parse-query";

@injectable()
export class RestaurantController {
    constructor(@inject(TOKENS.RestaurantService) private readonly restaurantService: RestaurantService) {}

    create = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateRestaurantDTO, req.body);
            const result = await this.restaurantService.createWithOwner(req.user?.role! as SystemRole, data);
            sendSuccess(res, {message: "Restaurant created", ...result}, 201);
        } catch (err) {
            next(err);
        }
    }

    getAll = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const params = parsePaginationQuery(req.query, ['createdAt', 'name', 'status']);
            const filters = parseFilters(req.query, ['id', 'status', 'name']);
            const result = await this.restaurantService.findAll(params, filters);
            sendPaginated(res, result.data, result.meta);
        } catch (err) {
            next(err);
        }
    }

    getById = async(req: Request, res: Response, next: NextFunction) => {
        try{
           const result = await this.restaurantService.getById(Number(req.params.id));
            sendSuccess(res, result);
        }catch(err){
            next(err);
        }
    }

    update = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(UpdateRestaurantDTO, req.body);
            const result = await this.restaurantService.update(Number(req.params.id), data, req.user?.role! as SystemRole, req.user?.userId!);
            sendSuccess(res, {message: "Restaurant updated", restaurant: result});
        }catch(err){
            next(err);
        }
    }

    updateStatus = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(UpdateRestaurantStatusDTO, req.body);
            const result = await this.restaurantService.updateStatus(Number(req.params.id), data, req.user?.role! as SystemRole);
            sendSuccess(res, {message: "Restaurant updated", restaurant: result});
        }catch(err){
            next(err);
        }
    }
}
