import {Router} from "express";
import {authenticate} from "../../common/auth/guard";
import {requireRestaurantMember, requireBranchAccess, rbac} from "../../common/auth/rbac";
import {branchController} from "./controller/branch.controller";

export const branchRouter = Router();

branchRouter.get('/branches/nearby', branchController.findNearby);
branchRouter.get('/restaurants/:restaurantId/branches', branchController.findByRestaurant);

branchRouter.post('/restaurants/:restaurantId/branches',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:branch", action:"create"}),
    branchController.create
);

branchRouter.patch('/branches/:id',
    authenticate,
    requireBranchAccess('id'),
    rbac({resource:"core:branch", action:"update"}),
    branchController.update
);

// system_admin only (checked in service)
branchRouter.patch('/branches/:id/status', authenticate, branchController.updateStatus);
