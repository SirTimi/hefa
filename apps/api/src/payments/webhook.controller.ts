import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DummyPaymentProvider } from './dummy.provider';
import { WalletService } from '../wallet/wallet.service';
import { PaymentProvider } from '@prisma/client';
import { SkipThrottle } from '@nestjs/throttler';
import { QueueService } from '../queue/queue.service';
import { NotifyQueueService } from '../notifications/queue/notify.queue';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('webhooks/payments')
@SkipThrottle()
export class PaymentsWebhookController {
  constructor(
    private prisma: PrismaService,
    private dummy: DummyPaymentProvider,
    private wallet: WalletService,
    private queue: QueueService,
    private notifyQ: NotifyQueueService,
  ) {}

  @Post('dummy')
  @HttpCode(200)
  async handleDummy(
    @Headers() headers: Record<string, any>,
    @Body() body: any,
  ) {
    // 1) Verify signature/payload
    const v = await this.dummy.verifyWebhook(headers, body);
    if (!v.ok) return { ok: false };

    // 2) Idempotency guard for the raw webhook event
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

    // 3) Locate the intent + order (include the fields we need for notifications)
    const intent = await this.prisma.paymentIntent.findUnique({
      where: {
        provider_providerRef: {
          provider: 'DUMMY',
          providerRef: v.intentProviderRef!,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            publicRef: true,
            createdByUserId: true,
            createdByMerchantId: true,
            customerEmail: true,
            customerPhone: true,
          },
        },
      },
    });
    if (!intent) throw new Error('intent not found');

    // 4) Process with retries guarded by BullMQ on failure
    try {
      if (v.status === 'succeeded') {
        // 4a) Post ESCROW HOLD (asset -> liability). This should be idempotent in WalletService.
        await this.wallet.postEscrowHold(
          intent.orderId,
          intent.amount,
          intent.currency,
          PaymentProvider.DUMMY,
          v.intentProviderRef!,
        );

        // 4b) Mark intent & order, and close the webhook event
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

        // 4c) Notify buyer (+ merchant heads-up)
        const order = intent.order;

        // Buyer contact (auth user → use profile; else guest fields)
        const buyerContact = order.createdByUserId
          ? await this.prisma.user.findUnique({
              where: { id: order.createdByUserId },
              select: { email: true, phone: true },
            })
          : null;

        await this.notifyQ.enqueue({
          kind: 'order_paid',
          to: {
            userId: order.createdByUserId ?? null,
            email: buyerContact?.email ?? order.customerEmail,
            phone: buyerContact?.phone ?? order.customerPhone,
          },
          data: {
            orderId: order.id,
            publicRef: order.publicRef,
            amount: intent.amount,
            currency: intent.currency,
          },
        });

        if (order.createdByMerchantId) {
          const merchant = await this.prisma.merchantProfile.findUnique({
            where: { id: order.createdByMerchantId },
            select: {
              storeName: true,
              user: { select: { id: true, email: true, phone: true } }, // <-- include id
            },
          });
          if (merchant?.user) {
            await this.notifyQ.enqueue({
              kind: 'order_paid',
              to: {
                userId: merchant.user.id, // <-- now populated
                email: merchant.user.email,
                phone: merchant.user.phone,
                name: merchant.storeName,
              },
              data: {
                orderId: order.id,
                publicRef: order.publicRef,
                amount: intent.amount,
                currency: intent.currency,
              },
            });
          }
        }
      } else if (v.status === 'failed') {
        // Mark failed + close webhook
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
    } catch (e) {
      // 5) Fallback: enqueue replay for flaky cases
      if (v.intentProviderRef) {
        if (v.status === 'succeeded') {
          await this.queue.enqueueReplay({
            kind: 'payments.charge.success',
            reference: v.intentProviderRef,
          });
        } else if (v.status === 'failed') {
          await this.queue.enqueueReplay(
            { kind: 'payments.refund', reference: v.intentProviderRef },
            { delay: 15_000 },
          );
        }
      }
      throw e;
    }

    return { ok: true };
  }
}
