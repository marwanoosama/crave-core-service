import {NextFunction, Request, Response} from "express";
import {container} from "../di/container";
import {TOKENS} from "../di/tokens";
import {ICacheProvider} from "../../pkg/cache/cache.interface";

export function withCache(ttl = 3600, userScoped = false){
    return async(req: Request, res: Response, next: NextFunction) =>{
        try{
            const cacheProvider : ICacheProvider = container.resolve(TOKENS.CacheProvider);

            let key = `${req.method}:${req.originalUrl}`;
            if(userScoped){
                key = `${key}:${req.user?.userId}`;
            }

            const cached = await cacheProvider.get(key);
            if(cached){
                res.setHeader("X-Cache", "HIT");
                return res.status(200).json(JSON.parse(cached));
            }

            // saving the original .json method so we can use it later in the function after doing the caching and getting the response from the controller
            const originalJson = res.json.bind(res);

            // overriding the .json method, so after calling next(), the controller will use this new logic in order to cache
            res.json = ((body: any) => {
                if(res.statusCode >= 200 && res.statusCode < 300){
                    cacheProvider.set(key, JSON.stringify(body), ttl);
                }
                res.setHeader("X-Cache", "MISS");
                return originalJson(body);
            });
            next();
        }catch(err){
            next(err);
        }
    }
}