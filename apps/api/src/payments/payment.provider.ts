export type CreateIntentInput = {
  orderId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
};
export type CreateIntentResult = {
  intentId: string;
  providerRef: string;
  payUrl: string;
};

export type WebhookVerification = {
  ok: boolean;
  eventId?: string;
  intentProviderRef?: string;
  status?: 'succeeded' | 'failed';
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
};

export interface PaymentProvider {
  createIntent(input: CreateIntentInput): Promise<CreateIntentResult>;
  verifyWebhook(
    headers: Record<string, any>,
    body: any,
  ): Promise<WebhookVerification>;
}
