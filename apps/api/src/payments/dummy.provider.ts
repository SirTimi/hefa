import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  CreateIntentInput,
  CreateIntentResult,
  WebhookVerification,
} from './payment.provider';
import { PrismaService } from '../prisma/prisma.service';

const SECRET = process.env.DUMMY_WEBHOOK_SECRET || 'dummy_secret';

@Injectable()
export class DummyPaymentProvider implements PaymentProvider {
  constructor(private prisma: PrismaService) {}

  async createIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
    // fake ref & URL
    const providerRef = `DUMMY_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const payUrl = `https://dummy.pay/intent/${providerRef}`;

    await this.prisma.paymentIntent.create({
      data: {
        orderId: input.orderId,
        provider: 'DUMMY',
        providerRef,
        status: 'PENDING',
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata ?? {},
      },
    });

    // also mark order as awaiting payment
    await this.prisma.order.update({
      where: { id: input.orderId },
      data: { status: 'PENDING_PAYMENT' },
    });

    return { intentId: providerRef, providerRef, payUrl };
  }

  async verifyWebhook(
    headers: Record<string, any>,
    body: any,
  ): Promise<WebhookVerification> {
    // Very basic: require the header to equal SECRET
    const sig = headers['x-dummy-signature'] || headers['X-Dummy-Signature'];
    if (sig !== SECRET) return { ok: false };

    // body example we expect to receive:
    // { eventId, providerRef, status: 'succeeded'|'failed', amount, currency, metadata }
    if (!body?.eventId || !body?.providerRef) return { ok: false };

    return {
      ok: true,
      eventId: body.eventId,
      intentProviderRef: body.providerRef,
      status: body.status,
      amount: body.amount,
      currency: body.currency,
      metadata: body.metadata ?? {},
    };
  }
}
