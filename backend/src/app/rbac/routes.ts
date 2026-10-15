import {Router} from "express";
import {authenticate} from "../../common/auth/guard";
import {requireRestaurantMember, rbac} from "../../common/auth/rbac";
import {restaurantMemberController} from "./controller/restaurant-member.controller";

export const rbacRouter = Router();

rbacRouter.post('/restaurants/:restaurantId/members',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:member", action:'create'}),
    restaurantMemberController.createMember
);