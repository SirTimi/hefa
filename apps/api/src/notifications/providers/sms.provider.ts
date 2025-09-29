import { Injectable } from '@nestjs/common';
import { TermiiProvider } from './termii.provider';

@Injectable()
export class SmsProvider {
  constructor(private termii: TermiiProvider) {}

  async send(to: string, text: string) {
    const provider = (process.env.SMS_PROVIDER ?? 'none').toLowerCase();
    if (provider === 'termii') return this.termii.send(to, text);
    // future: twilio, infobip, etc.
    // default no-op
    return { ok: true, skipped: 'no-sms-provider' };
  }
}
