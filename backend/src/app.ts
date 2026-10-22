import express from "express";
import {router} from "./routes.js";
import {correlationId} from "./lib/correlation/correlationId";
import {errorHandler} from "./lib/error/errorHandler";
import cookieParser from 'cookie-parser'
import {env} from "./lib/config/env";
import cors from "cors"
import helmet from "helmet"

export function createApp(){
    const app = express();
    app.use(helmet())
    app.use(cors({origin: env.cors.origins, credentials: true}));
    app.set('query parser', 'extended')
    app.use(express.json());
    app.use(cookieParser());
    app.use(correlationId);
    app.use('/api', router);
    app.use(errorHandler);
    return app;
}