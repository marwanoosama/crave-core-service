import type {Request, Response, NextFunction} from "express";
import type {AppError} from "./AppError";
import {container} from "../di/container";
import {TOKENS} from "../di/tokens";
import type {Logger} from "../logger/logger";

const logger = container.resolve<Logger>(TOKENS.Logger);

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
    const operational = err.isOperational;

    logger.error(err.message, {
        statusCode: err.statusCode,
        stack: err.stack,
        operational: operational,
        body: req.body,
        correlationId: req.correlationId
    })

    if(operational){
        return res.status(err.statusCode).json({
            error: err.message,
        })
    }
    return res.status(500).json({
        error: 'Something went wrong',
    })
}
