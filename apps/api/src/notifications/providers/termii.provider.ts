import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TermiiProvider {
  private base = process.env.TERMII_BASE_URL || 'https://api.ng.termii.com/api';
  private key = process.env.TERMII_API_KEY || '';
  private sender = process.env.TERMII_SENDER_ID || 'HEFA';

  async send(to: string, text: string) {
    if (!this.key) return { ok: false, reason: 'no-termii-key' };
    const payload = {
      to,
      from: this.sender,
      sms: text,
      type: 'plain',
      channel: 'generic',
      api_key: this.key,
    };
    const url = `${this.base}/sms/send`;
    const rsp = await axios.post(url, payload, { timeout: 10_000 });
    const ok = !!(
      rsp.data &&
      (rsp.data.message_id ||
        rsp.data.message_id === null ||
        rsp.data.code === 'ok')
    );
    return { ok, provider: 'termii', raw: rsp.data };
  }
}
