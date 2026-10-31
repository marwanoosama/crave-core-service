import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import type {UserController} from "./controller/user.controller";
import {authenticate} from "../../lib/auth/guard";
import {requireInternalApiKey} from "../../lib/auth/api-key";

export const userRouter = Router();
export const internalUserRouter = Router();

const userController = container.resolve<UserController>(TOKENS.UserController);

userRouter.get('/me', authenticate, userController.getMe);
userRouter.patch('/me', authenticate, userController.updateMe);

// Internal (service-to-service), mounted at /api/internal/*
internalUserRouter.get('/internal/agents/:id', requireInternalApiKey, userController.getAgentById);