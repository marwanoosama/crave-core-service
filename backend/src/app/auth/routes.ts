import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import type {AuthController} from "./controller/auth.controller";
import {idempotency} from "../../lib/idempotency/idempotency";
import {toSeconds} from "../../pkg/utils/time";

export const authRouter = Router();

const authController = container.resolve<AuthController>(TOKENS.AuthController);

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/forgetPassword', idempotency({strict: true, ttl: toSeconds(1, 'h')}), authController.forgetPassword);
authRouter.post('/resetPassword', authController.resetPassword);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/accept-invite', authController.acceptInvite);

