import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import type {ProductController} from "./controller/product.controller";
import {authenticate} from "../../lib/auth/guard";
import {requireRestaurantMember, requireBranchAccess, rbac} from "../../lib/auth/rbac";

export const productRouter = Router();

const productController = container.resolve<ProductController>(TOKENS.ProductController);

// public
productRouter.get('/restaurants/:restaurantId/categories', productController.findCategories);

productRouter.get('/restaurants/:restaurantId/products',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:product", action:"read"}),
    productController.findByRestaurant
);

// public
productRouter.get('/branches/:branchId/products', productController.findByBranch);
productRouter.get('/products/:id', productController.findById);

productRouter.post('/restaurants/:restaurantId/products',
    authenticate,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:product", action:"create"}),
    productController.create
);

productRouter.patch('/products/:id',
    authenticate,
    requireBranchAccess('branchId'),
    rbac({resource:"core:product", action:"update"}),
    productController.update
);
