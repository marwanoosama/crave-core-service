// check for permissions
// system admin bypass this
// restaurant users must have permissions for their role
// router.post('/products', authenticate, rbac({resource:"product",action:"create"}), productController.create)

import {Request, Response, NextFunction} from "express";
import {NotAuthenticated} from "./errors";
import {SystemRole} from "../../app/user/enums";
import {container} from "../di/container";
import {TOKENS} from "../di/tokens";
import type {PermissionCacheService} from "../../app/rbac/service/permission-cache.service";

const permissionCacheService = container.resolve<PermissionCacheService>(TOKENS.PermissionCacheService);

export interface RBACOptions{
    resource: string;
    action: string;
    allowSystemAdmin?: boolean; // true by default
}

export function rbac(options: RBACOptions){
    return async (req: Request, res: Response, next: NextFunction) =>{
        try{
            if(!req.user){
                throw NotAuthenticated;
            }
            const { resource, action, allowSystemAdmin = true } = options;

            if(allowSystemAdmin && req.user.role == SystemRole.SYSTEM_ADMIN){
                return next();
            }

            if(req.user.role == SystemRole.RESTAURANT_USER){
                const permissions = await permissionCacheService.getPermissions(req.user.restaurantRole!);
                if(!permissionCacheService.hasPermission(permissions, resource, action)){
                    return res.status(403).json({
                        error: "Permission denied",
                    });
                }

                return next();
            }

            return res.status(403).json({
                error: "Permission denied",
            })
        }catch(error){
            next(error);
        }
    }
}


// check if a restaurant member can access this restaurant
export function requireRestaurantMember(paramName: string = 'restaurantId'){
    return async(req: Request, res: Response, next: NextFunction) =>{
        const restaurantId = parseInt(req.params[paramName] as string);
        if(!restaurantId){
            return res.status(500).json({"message": "something went wrong"});
        }

        const userRestaurantId = Number(req.user?.restaurantId);
        if(userRestaurantId !== restaurantId){
            if(req.user?.role == SystemRole.SYSTEM_ADMIN){
                return next();
            }

            return res.status(403).json({
                error: "Permission denied",
            })
        }
        next();
    }
}

// check if restaurant member can access this branch
export function requireBranchAccess(paramName: string= 'branchId') {
    return async(req: Request, res: Response, next: NextFunction) => {
        if (req.user?.role == SystemRole.SYSTEM_ADMIN) {
            return next();
        }
        if (req.user?.restaurantRole == 'owner') {
            return next();
        }

        const branchId = parseInt(req.params[paramName] as string) || parseInt(req.query[paramName] as string);
        if (!branchId) {
            return next();
        }

        const userBranchIds = req.user?.branchIds || [];
        if(!userBranchIds?.includes(branchId)){
            return res.status(403).json({
                error: "Permission denied",
            })
        }
        next();
    }
}
