import {IEmailProvider} from "./email.interface";
import Mailjet from "node-mailjet";

export interface MailjetConfig{
    apiKey: string,
    secretKey: string,
    fromEmail: string,
    fromName: string
}

export class MailjetEmailProvider implements IEmailProvider{
    private readonly client: Mailjet;

    constructor(private readonly mailjetConfig: MailjetConfig) {
        this.client = new Mailjet({
            apiKey: mailjetConfig.apiKey,
            apiSecret: mailjetConfig.secretKey
        })
    }

    async send(to: string, subject: string, html: string): Promise<void> {
        await this.client.post("send", { version: "v3.1" }).request({
            Messages: [
                {
                    From: {
                        Email: this.mailjetConfig.fromEmail,
                        Name: this.mailjetConfig.fromName
                    },
                    To: [{ Email: to }],
                    Subject: subject,
                    HTMLPart: html
                }
            ]
        });
    }
}