import {config} from 'dotenv';
import {z} from 'zod';
import path from 'path';

config({path: path.resolve(__dirname,'../../../.env')}); // reads from .env

const schema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.string().default("3000"),
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.string().default("5432"),
    DB_USERNAME: z.string().default("postgres"),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    DB_POOL_MAX: z.string().default("10"),
    DB_MIGRATIONS_DIRECTORY: z.string(),
    DB_MIGRATIONS_EXTENSION: z.string(),
    ACCESS_SECRET: z.string(),
    REFRESH_SECRET: z.string(),
    ACCESS_EXPIRES_IN: z.string(),
    REFRESH_EXPIRES_IN: z.string(),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379'),
    REDIS_PASSWORD: z.string().default(""),
    // order-service integration (implementation plan §0.5)
    INTERNAL_API_KEY: z.string(),
    RABBITMQ_URL: z.string(),
    RABBITMQ_CORE_EVENTS_EXCHANGE: z.string().default('core.events'),
    OUTBOX_DRAIN_CRON: z.string().default("* * * * * *"), // every second
    OUTBOX_BATCH_SIZE: z.string().default("50"),
    MAILJET_API_KEY: z.string(),
    MAILJET_SECRET_KEY: z.string(),
    MAILJET_FROM_EMAIL: z.string(),
    MAILJET_FROM_NAME: z.string(),
})

const parsed = schema.parse(process.env);

export const env = {
    nodeEnv: parsed.NODE_ENV,
    isProduction: parsed.NODE_ENV === "production",
    port: Number(parsed.PORT),
    db: {
        host: parsed.DB_HOST,
        port: Number(parsed.DB_PORT),
        username: parsed.DB_USERNAME,
        password: parsed.DB_PASSWORD,
        name: parsed.DB_NAME,
        poolMax: Number(parsed.DB_POOL_MAX),
        migrationsDirectory: path.resolve(__dirname,"../../../",parsed.DB_MIGRATIONS_DIRECTORY),
        migrationsExtension: parsed.DB_MIGRATIONS_EXTENSION,
    },
    jwt: {
        refreshSecret: parsed.REFRESH_SECRET,
        accessSecret: parsed.ACCESS_SECRET,
        accessExpiresIn: parsed.ACCESS_EXPIRES_IN,
        refreshExpiresIn: parsed.REFRESH_EXPIRES_IN,
    },
    cors: {
        origins: parsed.CORS_ORIGINS.split(','),
    },
    redis:{
        host: parsed.REDIS_HOST,
        port: Number(parsed.REDIS_PORT),
        password: parsed.REDIS_PASSWORD
    },
    // shared secret, outbound calls order-service -> core send it as "api-key"
    internal: {
        apiKey: parsed.INTERNAL_API_KEY,
    },
    rabbitmq: {
        url: parsed.RABBITMQ_URL,
        coreEventsExchange: parsed.RABBITMQ_CORE_EVENTS_EXCHANGE,
    },
    outbox: {
        drainCron: parsed.OUTBOX_DRAIN_CRON,
        batchSize: Number(parsed.OUTBOX_BATCH_SIZE),
    },
    mailjet:{
        apiKey: parsed.MAILJET_API_KEY,
        secretKey: parsed.MAILJET_SECRET_KEY,
        fromEmail: parsed.MAILJET_FROM_EMAIL,
        fromName: parsed.MAILJET_FROM_NAME
    }
}


