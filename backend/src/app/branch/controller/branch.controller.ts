import {BranchService} from "../service/branch.service";
import {NextFunction, Request, Response} from "express";
import {validateBody} from "../../../lib/validation/validation";
import {CreateBranchDTO, UpdateBranchDTO, UpdateBranchStatusDTO} from "../dto/branch.dto";
import {SystemRole} from "../../user/enums";
import {inject, injectable} from "tsyringe";
import {TOKENS} from "../../../lib/di/tokens";
import {sendPaginated, sendSuccess} from "../../../lib/http/response";
import {parseFilters, parsePaginationQuery} from "../../../lib/http/pagination/parse-query";
import {BranchNotFoundError} from "../errors";

@injectable()
export class BranchController{
    constructor(@inject(TOKENS.BranchService) private readonly branchService: BranchService) {}

    findNearby = async(req: Request, res: Response, next: NextFunction) =>{
        try{
            const params = parsePaginationQuery(req.query, ['id', 'createdAt', 'restaurantName', 'label']);
            const filters = parseFilters(req.query, ['id', 'restaurantId', 'addressText', 'label']);
            const result = await this.branchService.findNearby(Number(req.query.lat), Number(req.query.lng), params, filters);
            sendPaginated(res, result.data, result.meta);
        }catch(err){
            next(err);
        }
    }

    findByRestaurant = async(req: Request, res: Response, next: NextFunction) =>{
        try{
            const result = await this.branchService.findByRestaurant(Number(req.params.restaurantId));
            sendSuccess(res, result);
        }catch(err){
            next(err);
        }
    }

    create = async(req: Request, res: Response, next: NextFunction) =>{
        try{
            const data = await validateBody(CreateBranchDTO, req.body);
            const result = await this.branchService.create(Number(req.params.restaurantId), data, req.user?.userId!, req.user?.role as SystemRole);

            sendSuccess(res, {...result, message: `Branch created for restaurant with id: ${result.restaurantId}`}, 201);
        }catch(err){
            next(err);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateBranchDTO, req.body);
            const branch = await this.branchService.update(Number(req.params.id), req.user?.userId!, req.user?.role! as SystemRole, data);
            sendSuccess(res, {message: "Branch updated", branch});
        } catch (err) {
            next(err);
        }
    }

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateBranchStatusDTO, req.body);
            const branch = await this.branchService.updateStatus(Number(req.params.id), req.user?.role! as SystemRole, data);
            sendSuccess(res, {message: "Branch status updated", branch: {id: branch.id, isActive: branch.isActive, acceptOrders: branch.acceptOrders, commission: branch.commission}});
        } catch (err) {
            next(err);
        }
    }

    findByIdWithRestaurant = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.branchService.findByIdWithRestaurant(Number(req.params.id));
            if (!result) throw BranchNotFoundError;

            const {branch, restaurantStatus} = result;
            sendSuccess(res, {
                id: branch.id,
                region: branch.countryCode,
                restaurantId: branch.restaurantId,
                restaurantStatus,
                acceptOrders: branch.acceptOrders,
                isActive: branch.isActive,
                deliveryFee: branch.deliveryFee,
                commissionBps: branch.commission,
                currency: branch.currency,
                lat: Number(branch.lat),
                lng: Number(branch.lng),
                name: branch.label,
                addressText: branch.addressText,
            });
        } catch (err) {
            next(err);
        }
    }
}
