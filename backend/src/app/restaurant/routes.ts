import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import type {RestaurantController} from "./controller/restaurant.controller";
import {authenticate} from "../../lib/auth/guard";
import {requireRestaurantMember, rbac} from "../../lib/auth/rbac";

export const restaurantRouter = Router();

const restaurantController = container.resolve<RestaurantController>(TOKENS.RestaurantController);

restaurantRouter.get('/', restaurantController.getAll);
restaurantRouter.get('/:id', restaurantController.getById);

// system_admin only (checked in service)
restaurantRouter.post('/', authenticate, restaurantController.create);

restaurantRouter.patch('/:id',
    authenticate,
    requireRestaurantMember('id'),
    rbac({resource:"core:restaurant", action:"update"}),
    restaurantController.update
);

// system_admin only (checked in service)
restaurantRouter.patch('/:id/status', authenticate, restaurantController.updateStatus);
