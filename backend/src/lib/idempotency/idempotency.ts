import {NextFunction, Request, Response} from "express";
import {ICacheProvider} from "../../pkg/cache/cache.interface";
import {container} from "../di/container";
import {TOKENS} from "../di/tokens";

interface IdempotencyOptions {
    strict: boolean;
    ttl: number;
}

export function idempotency(options: IdempotencyOptions){
    return async(req: Request, res: Response, next: NextFunction) => {
        try {
            if (!["POST", "PATCH", "PUT"].includes(req.method)) {
                return next();
            }

            const idempotencyKey = req.header("Idempotency-Key");
            if (!idempotencyKey) {
                if (options.strict) {
                    return res.status(400).json({
                        message: "Idempotency-Key header is required",
                    });
                }
                return next();
            }

            const cacheProvider: ICacheProvider = container.resolve(TOKENS.CacheProvider);
            if (!cacheProvider) {
                if (!options.strict) {
                    return next();
                }
                return res.status(503).json({
                    message: "Cannot resolve caching service"
                });
            }

            let key = `idempotency:${req.method}:${req.originalUrl}:${idempotencyKey}`;
            const cached = await cacheProvider.get(key);
            if (cached) {
                return res.status(200).json(JSON.parse(cached));
            }

            const originalJson = res.json.bind(res);
            res.json = ((body: any) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cacheProvider.set(key, JSON.stringify(body), options.ttl);
                }
                res.setHeader("X-Cache", "MISS");
                return originalJson(body);
            });
            next();
        }catch (err){
            if(!options.strict){
                next();
            }
            return res.status(503).json({
                message: "Idempotency service unavailable"
            });
        }
    }
}