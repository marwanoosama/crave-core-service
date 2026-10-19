import {Router} from "express";
import {container} from "../../lib/di/container";
import {TOKENS} from "../../lib/di/tokens";
import type {CustomerAddressController} from "./controller/customer-address.controller";
import {authenticate} from "../../lib/auth/guard";

export const customerAddressRouter = Router();

const customerAddressController = container.resolve<CustomerAddressController>(TOKENS.CustomerAddressController);

customerAddressRouter.get('/', authenticate, customerAddressController.getAll);
customerAddressRouter.post('/', authenticate, customerAddressController.create);
customerAddressRouter.patch('/:addressId', authenticate, customerAddressController.update);
customerAddressRouter.delete('/:addressId', authenticate, customerAddressController.remove);
