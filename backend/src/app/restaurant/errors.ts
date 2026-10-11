import {AppError} from "../../common/error/AppError";

export const RestaurantNotFoundError = new AppError('Restaurant not found', 404);
export const UnAuthorizedError = new AppError('Unauthorized user', 403);

export const OwnerAlreadyExistsError = new AppError('Restaurant not found', 400);




