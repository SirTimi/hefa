import fetch from 'node-fetch';

export class PaystackCharge {
  constructor(private secretKey: string) {}
  async initCharge(p: {
    amount: number;
    email: string;
    reference: string;
    callback_url?: string;
    metadata?: any;
    currency?: string;
  }) {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: p.amount, // kobo (NGN); ensure you pass integer kobo
        email: p.email,
        reference: p.reference,
        callback_url: p.callback_url,
        metadata: p.metadata,
        currency: p.currency ?? 'NGN',
      }),
    });
    const json = await res.json();
    if (!json.status) throw new Error(`Paystack init failed: ${json.message}`);
    return {
      authorization_url: json.data.authorization_url,
      access_code: json.data.access_code,
    };
  }
  verifySignature(rawBody: Buffer, signature: string) {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha512', this.secretKey)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }
}
