import {NextFunction, Response, Request} from "express";
import {
    CreateRestaurantMemberDTO,
    UpdateMemberBranchesDTO,
    UpdateRestaurantMemberDto
} from "../dto/restaurant-member.dto";
import type {RestaurantMemberService} from "../service/restaurant-member.service";
import {validateBody} from "../../../lib/validation/validation";
import {validate} from "class-validator";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendSuccess} from "../../../lib/http/response";
import {RoleQueryRequiredError} from "../errors";

@injectable()
export class RestaurantMemberController {
    constructor(@inject(TOKENS.RestaurantMemberService) private readonly restaurantMemberService: RestaurantMemberService) {}

    createMember = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateRestaurantMemberDTO,req.body);
            const result = await this.restaurantMemberService.createRestaurantMember(Number(req.params.restaurantId), data);
            sendSuccess(res, result);
        }
        catch (error) {
            next(error);
        }
    }

    listMembers = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await this.restaurantMemberService.listRestaurantMembers(Number(req.params.restaurantId));
            sendSuccess(res, result);
        }catch(error){
            next(error);
        }
    }

    updateMember = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(UpdateRestaurantMemberDto, req.body);
            const result = await this.restaurantMemberService.updateRestaurantMember(Number(req.params.restaurantId), Number(req.params.memberId), data);
            sendSuccess(res, result);
        }catch(error){
            next(error);
        }
    }

    deleteMember = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await this.restaurantMemberService.deleteRestaurantMember(Number(req.params.restaurantId), Number(req.params.memberId));
            sendSuccess(res, result);
        }catch(error){
            next(error);
        }
    }

    updateMemberBranches = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(UpdateMemberBranchesDTO, req.body);
            const result = await this.restaurantMemberService.updateRestaurantMemberBranches(Number(req.params.restaurantId), Number(req.params.memberId), data);
            sendSuccess(res, result);
        }catch(error){
            next(error);
        }
    }

    getRolePermissions = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await this.restaurantMemberService.getRolePermissions(req.params.role as string);
            sendSuccess(res, result);
        }catch(error){
            next(error);
        }
    }

    getPermissionsByRole = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const role = String(req.query.role ?? "");
            if (!role) throw RoleQueryRequiredError;

            const result = await this.restaurantMemberService.getPermissionsByRole(role);
            sendSuccess(res, result);
        }catch(error){
            next(error);
        }
    }
}
