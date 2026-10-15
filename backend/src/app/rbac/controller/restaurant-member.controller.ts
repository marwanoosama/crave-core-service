import {NextFunction, Response, Request} from "express";
import {CreateRestaurantMemberDTO} from "../dto/restaurant-member.dto";
import {restaurantMemberService} from "../service/restaurant-member.service";
import {validateBody} from "../../../common/validation/validation";

export class RestaurantMemberController {
    createMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateRestaurantMemberDTO,req.body);
            const result = await restaurantMemberService.createRestaurantMember(Number(req.params.restaurantId), data);
            res.status(200).send(result);
        }
        catch (error) {
            next(error);
        }
    }
}

export const restaurantMemberController = new RestaurantMemberController();