import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import type {AuthController} from "./controller/auth.controller";

export const authRouter = Router();

const authController = container.resolve<AuthController>(TOKENS.AuthController);

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/forgetPassword', authController.forgetPassword);
authRouter.post('/resetPassword', authController.resetPassword);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/accept-invite', authController.acceptInvite);

