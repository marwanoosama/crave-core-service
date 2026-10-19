import {BranchService} from "../service/branch.service";
import {NextFunction, Request, Response} from "express";
import {validateBody} from "../../../lib/validation/validation";
import {CreateBranchDTO, UpdateBranchDTO, UpdateBranchStatusDTO} from "../dto/branch.dto";
import {SystemRole} from "../../user/enums";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";

@injectable()
export class BranchController{
    constructor(@inject(TOKENS.BranchService) private readonly branchService: BranchService) {}

    findNearby = async(req: Request, res: Response, next: NextFunction) =>{
        try{
            const result = await this.branchService.findNearby(Number(req.query.lat), Number(req.query.lng));
            res.status(200).json({data: result});
        }catch(err){
            next(err);
        }
    }

    findByRestaurant = async(req: Request, res: Response, next: NextFunction) =>{
        try{
            const result = await this.branchService.findByRestaurant(Number(req.params.restaurantId));
            res.status(200).json({data: result});
        }catch(err){
            next(err);
        }
    }

    create = async(req: Request, res: Response, next: NextFunction) =>{
        try{
            const data = await validateBody(CreateBranchDTO, req.body);
            const result = await this.branchService.create(Number(req.params.restaurantId), data, req.user?.userId!, req.user?.role as SystemRole);

            res.status(201).json({...result, message: `Branch created for restaurant with id: ${result.restaurantId}`});
        }catch(err){
            next(err);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateBranchDTO, req.body);
            const branch = await this.branchService.update(Number(req.params.id), req.user?.userId!, req.user?.role! as SystemRole, data);
            res.status(200).json({message: "Branch updated", branch});
        } catch (err) {
            next(err);
        }
    }

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateBranchStatusDTO, req.body);
            const branch = await this.branchService.updateStatus(Number(req.params.id), req.user?.role! as SystemRole, data);
            res.status(200).json({message: "Branch status updated", branch: {id: branch.id, isActive: branch.isActive, acceptOrders: branch.acceptOrders, commission: branch.commission}});
        } catch (err) {
            next(err);
        }
    }
}
