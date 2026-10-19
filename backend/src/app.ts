import express from "express";
import {router} from "./routes.js";
import {correlationId} from "./lib/correlation/correlationId";
import {errorHandler} from "./lib/error/errorHandler";
import cookieParser from 'cookie-parser'

export function createApp(){
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(correlationId);
    app.use('/api', router);
    app.use(errorHandler);
    return app;
}