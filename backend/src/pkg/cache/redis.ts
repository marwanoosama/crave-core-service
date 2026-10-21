import {ICacheProvider} from "./cache.interface";
import {Redis} from "ioredis"

export interface RedisConfig{
    host: string;
    port: number;
    password?: string;
}

export class RedisCacheProvider implements ICacheProvider{
    private readonly client: Redis;

    constructor(private readonly config: RedisConfig) {
        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            lazyConnect: true,
            maxRetriesPerRequest: 3
        });

        this.client.on("error", (err) => {console.log("Redis Error: ", err.message)});
        this.client.connect().catch((err) => {console.log("Redis connection error: ", err)});
    }

    async get(key: string): Promise<any> {
        return this.client.get(key);
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<any> {
        if(ttlSeconds){
            await this.client.set(key, value, "EX", ttlSeconds);
        }else{
            await this.client.set(key, value);

        }
    }

    async del(key: string): Promise<any> {
        return this.client.del(key);
    }
}