import axios from 'axios';
import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  PaymentsProvider,
  CreateIntentInput,
  CreateIntentResult,
} from './payments.port';

@Injectable()
export class PaystackProvider implements PaymentsProvider {
  private base = process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co';
  private sk = process.env.PAYSTACK_SECRET_KEY!;

  async createIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
    const ref = `hefa_${input.orderId}_${Date.now()}`;
    const body = {
      email: input.email || 'buyer@hefa.local',
      amount: input.amount,
      currency: input.currency,
      reference: ref,
      metadata: { orderId: input.orderId, ...input.metadata },
    };
    const rsp = await axios.post(`${this.base}/transaction/initialize`, body, {
      headers: {
        Authorization: `Bearer ${this.sk}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    const data = rsp.data?.data;
    return {
      provider: 'PAYSTACK',
      reference: data.reference,
      authorizationUrl: data.authorization_url,
    };
  }

  async parseWebhook(rawBody: Buffer, signature?: string) {
    if (!signature) return { ok: false, event: 'missing-signature' as const };
    const expected = crypto
      .createHmac('sha512', this.sk)
      .update(rawBody)
      .digest('hex');
    if (expected !== signature)
      return { ok: false, event: 'bad-signature' as const };

    const payload = JSON.parse(rawBody.toString('utf8'));
    const evt = payload?.event as string;
    const data = payload?.data ?? {};
    // Paystack has data.id (number) and data.reference
    const eventId = String(
      data.id ??
        data.reference ??
        crypto.createHash('sha256').update(rawBody).digest('hex'),
    );

    return {
      ok: true,
      event: evt,
      eventId,
      reference: data.reference as string | undefined,
      amount: data.amount as number | undefined,
      currency: data.currency as string | undefined,
      raw: payload,
    };
  }

  async createTransferRecipient(params: {
    bankCode: string;
    accountNo: string;
    name?: string;
  }) {
    const rsp = await axios.post(
      `${this.base}/transferrecipient`,
      {
        type: 'nuban',
        name: params.name || 'HEFA Recipient',
        account_number: params.accountNo,
        bank_code: params.bankCode,
        currency: 'NGN',
      },
      { headers: { Authorization: `Bearer ${this.sk}` } },
    );
    const code = rsp.data?.data?.recipient_code as string;
    if (!code) throw new Error('paystack: no recipient_code');
    return code;
  }

  async initiateTransfer(params: {
    amount: number;
    currency: string;
    recipientCode: string;
    reason?: string;
    reference: string;
  }) {
    const rsp = await axios.post(
      `${this.base}/transfer`,
      {
        source: 'balance',
        amount: params.amount,
        currency: params.currency,
        reciepient: params.recipientCode,
        reason: params.reason ?? 'HEFA payout',
        reference: params.reference,
      },
      { headers: { Authorization: `Bearer ${this.sk}` } },
    );
    const data = rsp.data?.data;
    return { reference: data?.reference as string };
  }
}
