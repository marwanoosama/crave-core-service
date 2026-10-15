import {AppError} from "../../common/error/AppError";

export const CannotCreateOwnerUserError = new AppError("Owner cannot create new user", 403);
export const RoleNotFoundError = new AppError("Role does not exist", 404);

