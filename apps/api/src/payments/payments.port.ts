import { AnyARecord } from 'node:dns';

export interface CreateIntentInput {
  orderId: string;
  email: string;
  currency: string;
  amount: number;
  metadata?: Record<string, any>;
}

export interface CreateIntentResult {
  provider: 'PAYSTACK';
  reference: string;
  authorizationUrl: string;
}

export interface PaymentsProvider {
  createIntent(input: CreateIntentInput): Promise<CreateIntentResult>;
  parseWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<{
    ok: boolean;
    event: string;
    reference?: string;
    amount?: number;
    currency?: string;
    raw?: any;
  }>;
}
