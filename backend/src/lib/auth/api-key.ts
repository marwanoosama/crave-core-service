// Internal service-to-service auth: shared-secret `api-key` header.
// Used by internal routes mounted under the `/internal/...` prefix that
// other services (order-service) call synchronously over HTTP — plain
// equality against the env value; the network/service boundary is the
// trust horizon, not the header scheme.

import {Request, Response, NextFunction} from "express";
import {env} from "../config/env";
import {AppError} from "../error/AppError";

export const InternalApiKeyInvalid = new AppError("Invalid or missing api-key", 401);

export function requireInternalApiKey(req: Request, res: Response, next: NextFunction) {
    const provided = req.header("api-key");
    if (!provided || provided !== env.internal.apiKey) {
        throw InternalApiKeyInvalid;
    }
    next();
}
