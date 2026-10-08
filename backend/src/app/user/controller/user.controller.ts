import {UserService, userService} from "../service/user.service";
import {NextFunction, Response, Request} from "express";
import {validateBody} from "../../../common/validation/validation";
import {UpdateUserDTO} from "../dto/user.dto";

export class UserController {
    constructor(private readonly userService: UserService) {}

    getMe = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const user = await this.userService.getByUserId(req.user?.userId!);
            return res.status(200).json(user);
        }catch(err){
            next(err);
        }
    }

    updateMe = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateUserDTO, req.body);
            const user = await this.userService.updateProfile(req.user?.userId!, data);
            res.status(200).json({message: "Profile updated", user});
        } catch (err) {
            next(err);
        }
    }
}

export const userController = new UserController(userService);