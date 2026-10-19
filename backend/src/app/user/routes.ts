import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import type {UserController} from "./controller/user.controller";
import {authenticate} from "../../lib/auth/guard";

export const userRouter = Router();

const userController = container.resolve<UserController>(TOKENS.UserController);

userRouter.get('/me', authenticate, userController.getMe);
userRouter.patch('/me', authenticate, userController.updateMe);