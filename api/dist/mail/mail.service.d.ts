import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    send(to: string, subject: string, text: string): Promise<{
        queued: boolean;
        mode: "log";
    } | {
        queued: boolean;
        mode: "smtp";
    }>;
}
