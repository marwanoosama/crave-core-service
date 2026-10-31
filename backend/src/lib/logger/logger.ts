import {injectable} from "tsyringe";

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

@injectable()
export class Logger {

    log(level: LogLevel, message: string, metadata: Record<string, unknown> = {}) {
        const logObject = {
            level: level,
            message: message,
            timestamp: Date.now(),
            ...metadata
        }
        // this could call datadog logger
        console.log(JSON.stringify(logObject));
    }

    info(message: string, metadata: Record<string, unknown> = {}) {
        this.log('info', message, metadata);
    }

    error(message: string, metadata: Record<string, unknown> = {}) {
        this.log('error', message, metadata);
    }

    warn(message: string, metadata: Record<string, unknown> = {}) {
        this.log('warn', message, metadata);
    }

    debug(message: string, metadata: Record<string, unknown> = {}) {
        this.log('debug', message, metadata);
    }
}

// Standalone instance for non-DI contexts (the outbox worker, for example).
export const logger = new Logger();
