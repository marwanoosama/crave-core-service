import 'reflect-metadata';
import http from "http"
import './lib/di/container.js'
import {createApp} from './app.js'
import {env} from './lib/config/env.js'
import {db} from './lib/knex/knex.js'

const app = createApp();
const server = http.createServer(app);

server.listen(env.port, () => {
    console.log(`Listening on ${env.port}`);
});

async function shutDown(){
    server.close(async () => {
        await db.destroy();
        console.log("db closed");
        process.exit(0);
    });
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);

