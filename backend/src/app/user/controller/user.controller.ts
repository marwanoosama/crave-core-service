import {UserService} from "../service/user.service";
import {NextFunction, Response, Request} from "express";
import {validateBody} from "../../../lib/validation/validation";
import {UpdateUserDTO} from "../dto/user.dto";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendSuccess} from "../../../lib/http/response";

@injectable()
export class UserController {
    constructor(@inject(TOKENS.UserService) private readonly userService: UserService) {}

    getMe = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const user = await this.userService.getByUserId(req.user?.userId!);
            sendSuccess(res, user);
        }catch(err){
            next(err);
        }
    }

    updateMe = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateUserDTO, req.body);
            const user = await this.userService.updateProfile(req.user?.userId!, data);
            sendSuccess(res, {message: "Profile updated", user});
        } catch (err) {
            next(err);
        }
    }

    getAgentById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const agent = await this.userService.getAgentById(Number(req.params.id));
            sendSuccess(res, agent);
        } catch (err) {
            next(err);
        }
    }
}
