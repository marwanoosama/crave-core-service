export const TOKENS = {
    // services
    AuthService: Symbol.for("AuthService"),
    UserService: Symbol.for("UserService"),
    RestaurantService: Symbol.for("RestaurantService"),
    BranchService: Symbol.for("BranchService"),
    RestaurantMemberService: Symbol.for("RestaurantMemberService"),
    ProductService: Symbol.for("ProductService"),
    CustomerAddressService: Symbol.for("CustomerAddressService"),
    PermissionCacheService: Symbol.for("PermissionCacheService"),

    // controllers
    AuthController: Symbol.for("AuthController"),
    UserController: Symbol.for("UserController"),
    RestaurantController: Symbol.for("RestaurantController"),
    BranchController: Symbol.for("BranchController"),
    RestaurantMemberController: Symbol.for("RestaurantMemberController"),
    ProductController: Symbol.for("ProductController"),
    CustomerAddressController: Symbol.for("CustomerAddressController"),


    // infra
    Logger: Symbol.for("Logger"),
    CacheProvider: Symbol.for("CacheProvider"),
}