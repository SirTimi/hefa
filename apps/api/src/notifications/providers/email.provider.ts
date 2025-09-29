import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

type SendResult = { ok: boolean; id?: string; reason?: string };

@Injectable()
export class EmailProvider {
  private transporter =
    process.env.SMTP_HOST && process.env.SMTP_USER
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? '587'),
          secure: false,
          auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
        })
      : null;

  // Overloads (3-arg and 4-arg) so both call sites type-check
  async send(to: string, subject: string, text: string): Promise<SendResult>;
  async send(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<SendResult>;
  async send(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<SendResult> {
    if (!this.transporter) return { ok: false, reason: 'no-smtp' };
    const from = process.env.EMAIL_FROM || 'no-reply@hefa.test';
    const info = await this.transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true, id: info.messageId };
  }
}
