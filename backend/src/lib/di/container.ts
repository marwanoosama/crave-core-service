import {container} from "tsyringe";
import {TOKENS} from "./tokens";
import {AuthController} from "../../app/auth/controller/auth.controller";
import {UserController} from "../../app/user/controller/user.controller";
import {RestaurantController} from "../../app/restaurant/controller/restaurant.controller";
import {BranchController} from "../../app/branch/controller/branch.controller";
import {RestaurantMemberController} from "../../app/rbac/controller/restaurant-member.controller";
import {ProductController} from "../../app/product/controller/product.controller";
import {CustomerAddressController} from "../../app/customer-address/controller/customer-address.controller";
import {RestaurantMemberService} from "../../app/rbac/service/restaurant-member.service";
import {CustomerAddressService} from "../../app/customer-address/service/customer-address.service";
import { ProductService } from "../../app/product/service/product.service";
import {BranchService} from "../../app/branch/service/branch.service";
import {RestaurantService} from "../../app/restaurant/service/restaurant.service";
import {UserService} from "../../app/user/service/user.service";
import {AuthService} from "../../app/auth/service/auth.service";
import {PermissionCacheService} from "../../app/rbac/service/permission-cache.service";
import {Logger} from "../logger/logger";

container.registerSingleton<Logger>(TOKENS.Logger, Logger);


container.registerSingleton<UserService>(TOKENS.UserService, UserService);
container.registerSingleton<RestaurantService>(TOKENS.RestaurantService, RestaurantService);
container.registerSingleton<BranchService>(TOKENS.BranchService, BranchService);
container.registerSingleton<ProductService>(TOKENS.ProductService, ProductService);
container.registerSingleton<RestaurantMemberService>(TOKENS.RestaurantMemberService, RestaurantMemberService);
container.registerSingleton<CustomerAddressService>(TOKENS.CustomerAddressService, CustomerAddressService);
container.registerSingleton<PermissionCacheService>(TOKENS.PermissionCacheService, PermissionCacheService);
container.registerSingleton<AuthService>(TOKENS.AuthService, AuthService);

container.registerSingleton(TOKENS.AuthController, AuthController);
container.registerSingleton(TOKENS.UserController, UserController);
container.registerSingleton(TOKENS.RestaurantController, RestaurantController);
container.registerSingleton(TOKENS.BranchController, BranchController);
container.registerSingleton(TOKENS.RestaurantMemberController, RestaurantMemberController);
container.registerSingleton(TOKENS.ProductController, ProductController);
container.registerSingleton(TOKENS.CustomerAddressController, CustomerAddressController);

// Re-export the tsyringe instance so the rest of the app resolves from one container.
export {container};

