import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, subject: string, text: string) {
    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.log(`[mail:dev] to=${to} subject=${subject} body=${text}`);
      return { queued: true, mode: 'log' as const };
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(this.config.get('SMTP_PORT') ?? 587),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });

    await transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM') ?? 'noreply@greyon.com.kh',
      to,
      subject,
      text,
    });
    return { queued: true, mode: 'smtp' as const };
  }
}
