export interface IMessageBroker {
    connect(): Promise<void>;
    close(): Promise<void>;
    declareExchange(exchange: string): Promise<void>; // ensure that an exchange exists (which routes messages to queues)
    publishConfirmed(exchange: string, routingKey: string, body: Buffer): Promise<void>;
}
