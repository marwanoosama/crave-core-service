import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import type {RestaurantMemberController} from "./controller/restaurant-member.controller";
import {authenticate} from "../../lib/auth/guard";
import {requireRestaurantMember, rbac} from "../../lib/auth/rbac";
import {requireInternalApiKey} from "../../lib/auth/api-key";

export const rbacRouter = Router();

const restaurantMemberController = container.resolve<RestaurantMemberController>(TOKENS.RestaurantMemberController);

// public
rbacRouter.get('/roles/:role/permissions',
    restaurantMemberController.getRolePermissions
);

// Internal (service-to-service)
rbacRouter.get('/internal/rbac/permissions', requireInternalApiKey, restaurantMemberController.getPermissionsByRole);

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
