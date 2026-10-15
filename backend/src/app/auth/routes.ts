import {Router} from "express";
import {authController} from "./controller/auth.controller";

export const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/forgetPassword', authController.forgetPassword);
authRouter.post('/resetPassword', authController.resetPassword);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/accept-invite', authController.acceptInvite);

