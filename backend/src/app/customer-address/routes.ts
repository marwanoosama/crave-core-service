import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import type {CustomerAddressController} from "./controller/customer-address.controller";
import {authenticate} from "../../lib/auth/guard";
import {requireInternalApiKey} from "../../lib/auth/api-key";

export const customerAddressRouter = Router();
export const internalCustomerAddressRouter = Router();

const customerAddressController = container.resolve<CustomerAddressController>(TOKENS.CustomerAddressController);

customerAddressRouter.get('/', authenticate, customerAddressController.getAll);
customerAddressRouter.post('/', authenticate, customerAddressController.create);
customerAddressRouter.patch('/:addressId', authenticate, customerAddressController.update);
customerAddressRouter.delete('/:addressId', authenticate, customerAddressController.remove);

// Internal (service-to-service), mounted at /api/internal/*
internalCustomerAddressRouter.get('/internal/customer-addresses/:id', requireInternalApiKey, customerAddressController.getById);
