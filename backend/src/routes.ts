import {Router} from 'express';
import {healthRouter} from "./app/health/health.routes.js";
import {authRouter} from "./app/auth/routes";
import {userRouter, internalUserRouter} from "./app/user/routes";
import {customerAddressRouter, internalCustomerAddressRouter} from "./app/customer-address/routes";
import {restaurantRouter} from "./app/restaurant/routes";
import {branchRouter} from "./app/branch/routes";
import {productRouter} from "./app/product/routes";
import {rbacRouter} from "./app/rbac/routes";

export const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/customer-address", customerAddressRouter);
router.use("/restaurant", restaurantRouter);
router.use("/", branchRouter);
router.use('/', productRouter)
router.use('/', rbacRouter)

// Internal service-to-service routes live under /api/internal/*.
// Branch and product routers are already mounted at "/", so their internal
// routes are registered directly inside those module routers.
router.use('/', internalUserRouter);
router.use('/', internalCustomerAddressRouter);