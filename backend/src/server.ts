import 'reflect-metadata';
import http from "http"
import './lib/di/container.js'
import {createApp} from './app.js'
import {env} from './lib/config/env.js'
import {db} from './lib/knex/knex.js'

const app = createApp();
const server = http.createServer(app);

function startServer(port: number) {
    const listener = server.listen(port, () => {
        console.log(`Listening on ${port}`);
    });
    listener.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`Port ${port} in use, trying next port...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
}

startServer(env.port);


async function shutDown(){
    server.close(async () => {
        await db.destroy();
        console.log("db closed");
        process.exit(0);
    });
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);

