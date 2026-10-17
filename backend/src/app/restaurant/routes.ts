import {Router} from "express";
import {restaurantController} from "./controller/restaurant.controller";
import {authenticate} from "../../common/auth/guard";
import {requireRestaurantMember, rbac} from "../../common/auth/rbac";

export const restaurantRouter = Router();

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
