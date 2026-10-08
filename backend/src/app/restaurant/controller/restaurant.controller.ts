import {NextFunction, Request, Response} from "express";
import {RestaurantService, restaurantService} from "../service/restaurant.service";

export class RestaurantController {
    constructor(private readonly restaurantService: RestaurantService) {}

    getAll = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.restaurantService.findAll();
            res.status(200).json({data: result});
        } catch (err) {
            next(err);
        }
    }
}

export const restaurantController = new RestaurantController(restaurantService)