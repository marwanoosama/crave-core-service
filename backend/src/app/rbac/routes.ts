import {Router} from "express";
import {authenticate} from "../../common/auth/guard";
import {requireRestaurantMember, rbac} from "../../common/auth/rbac";
import {restaurantMemberController} from "./controller/restaurant-member.controller";

export const rbacRouter = Router();

// public
rbacRouter.get('/roles/:role/permissions',
    restaurantMemberController.getRolePermissions
);

rbacRouter.post('/restaurants/:restaurantId/members',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'create'}),
    restaurantMemberController.createMember
);

rbacRouter.get('/restaurants/:restaurantId/members',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'read'}),
    restaurantMemberController.listMembers
);

rbacRouter.patch('/restaurants/:restaurantId/members/:memberId',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'update'}),
    restaurantMemberController.updateMember
);

rbacRouter.delete('/restaurants/:restaurantId/members/:memberId',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'delete'}),
    restaurantMemberController.deleteMember
);

rbacRouter.put('/restaurants/:restaurantId/members/:memberId/branches',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'update'}),
    restaurantMemberController.updateMemberBranches
);
