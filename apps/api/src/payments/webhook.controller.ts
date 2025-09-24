import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DummyPaymentProvider } from './dummy.provider';
import { WalletService } from '../wallet/wallet.service';
import { PaymentProvider } from '@prisma/client';

@Controller('webhooks/payments')
export class PaymentsWebhookController {
  constructor(
    private prisma: PrismaService,
    private dummy: DummyPaymentProvider,
    private wallet: WalletService,
  ) {}

  @Post('dummy')
  @HttpCode(200)
  async handleDummy(
    @Headers() headers: Record<string, any>,
    @Body() body: any,
  ) {
    const v = await this.dummy.verifyWebhook(headers, body);
    if (!v.ok) return { ok: false };

    // Idempotency: skip if already processed
    const existing = await this.prisma.webhookEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: 'DUMMY',
          providerEventId: v.eventId!,
        },
      },
    });
    if (existing?.processedAt) return { ok: true, idempotent: true };

    await this.prisma.webhookEvent.upsert({
      where: {
        provider_providerEventId: {
          provider: 'DUMMY',
          providerEventId: v.eventId!,
        },
      },
      create: { provider: 'DUMMY', providerEventId: v.eventId!, payload: body },
      update: { payload: body },
    });

    // Find intent & order
    const intent = await this.prisma.paymentIntent.findUnique({
      where: {
        provider_providerRef: {
          provider: 'DUMMY',
          providerRef: v.intentProviderRef!,
        },
      },
      include: { order: true },
    });
    if (!intent) throw new Error('intent not found');

    if (v.status === 'succeeded') {
      // Post escrow HOLD (idempotent) and update state
      await this.wallet.postEscrowHold(
        intent.orderId,
        intent.amount,
        intent.currency,
        PaymentProvider.DUMMY,
        v.intentProviderRef!,
      );

      await this.prisma.$transaction([
        this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'SUCCEEDED' },
        }),
        this.prisma.order.update({
          where: { id: intent.orderId },
          data: { status: 'PAID_HELD' },
        }),
        this.prisma.webhookEvent.update({
          where: {
            provider_providerEventId: {
              provider: 'DUMMY',
              providerEventId: v.eventId!,
            },
          },
          data: { processedAt: new Date(), success: true },
        }),
      ]);
    } else if (v.status === 'failed') {
      await this.prisma.$transaction([
        this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: { status: 'FAILED' },
        }),
        this.prisma.webhookEvent.update({
          where: {
            provider_providerEventId: {
              provider: 'DUMMY',
              providerEventId: v.eventId!,
            },
          },
          data: { processedAt: new Date(), success: false },
        }),
      ]);
    }

    return { ok: true };
  }
}
