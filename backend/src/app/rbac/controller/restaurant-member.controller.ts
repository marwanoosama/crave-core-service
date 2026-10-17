import {NextFunction, Response, Request} from "express";
import {
    CreateRestaurantMemberDTO,
    UpdateMemberBranchesDTO,
    UpdateRestaurantMemberDto
} from "../dto/restaurant-member.dto";
import {restaurantMemberService} from "../service/restaurant-member.service";
import {validateBody} from "../../../common/validation/validation";
import {validate} from "class-validator";

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

    listMembers = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await restaurantMemberService.listRestaurantMembers(Number(req.params.restaurantId));
            res.status(200).send(result);
        }catch(error){
            next(error);
        }
    }

    updateMember = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(UpdateRestaurantMemberDto, req.body);
            const result = await restaurantMemberService.updateRestaurantMember(Number(req.params.restaurantId), Number(req.params.memberId), data);
            res.status(200).send(result);
        }catch(error){
            next(error);
        }
    }

    deleteMember = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await restaurantMemberService.deleteRestaurantMember(Number(req.params.restaurantId), Number(req.params.memberId));
            res.status(200).send(result);
        }catch(error){
            next(error);
        }
    }

    updateMemberBranches = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(UpdateMemberBranchesDTO, req.body);
            const result = await restaurantMemberService.updateRestaurantMemberBranches(Number(req.params.restaurantId), Number(req.params.memberId), data);
            res.status(200).send(result);
        }catch(error){
            next(error);
        }
    }

    getRolePermissions = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await restaurantMemberService.getRolePermissions(req.params.role as string);
            res.status(200).send(result);
        }catch(error){
            next(error);
        }
    }
}

export const restaurantMemberController = new RestaurantMemberController();