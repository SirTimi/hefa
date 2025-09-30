import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PaymentProvider } from '@prisma/client';
import { PaystackCharge } from './paystack.charge';

@Controller('payments/paystack')
export class PaystackChargeController {
  private charge = new PaystackCharge(process.env.PAYSTACK_SECRET_KEY!);
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  @Post('init')
  async init(
    @Body()
    body: {
      orderId: string;
      email: string;
      amountKobo?: number;
      currency?: string;
      callbackUrl?: string;
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: body.orderId },
    });
    if (!order) throw new Error('order not found');
    if (!['DRAFT', 'PENDING_PAYMENT'].includes(order.status))
      throw new Error('order not payable');

    const reference = `ch_${order.id}_${Date.now()}`;
    // create intent now
    await this.prisma.paymentIntent.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.PAYSTACK,
        providerRef: reference,
        status: 'PENDING',
        amount: body.amountKobo ?? order.amount,
        currency: body.currency ?? order.currency,
        metadata: { orderId: order.id },
      },
    });

    const init = await this.charge.initCharge({
      amount: body.amountKobo ?? order.amount,
      email: body.email,
      reference,
      callback_url: body.callbackUrl,
      metadata: { orderId: order.id },
      currency: body.currency ?? order.currency,
    });
    return { reference, authorization_url: init.authorization_url };
  }
}

@Controller('webhooks/payments')
export class PaystackChargeWebhookController {
  private charge = new PaystackCharge(process.env.PAYSTACK_SECRET_KEY!);
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  @Post('paystack')
  @HttpCode(200)
  async webhook(@Req() req: any, @Headers('x-paystack-signature') sig: string) {
    const raw: Buffer = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    if (!this.charge.verifySignature(raw, sig ?? '')) return { ok: false };

    const event = req.body?.event;
    const data = req.body?.data;
    const reference = data?.reference;
    if (!reference) return { ok: true }; // ignore

    // idempotency for webhook
    await this.prisma.webhookEvent.upsert({
      where: {
        provider_providerEventId: {
          provider: 'PAYSTACK',
          providerEventId: reference,
        },
      },
      create: {
        provider: 'PAYSTACK',
        providerEventId: reference,
        payload: req.body,
      },
      update: { payload: req.body },
    });

    const intent = await this.prisma.paymentIntent.findUnique({
      where: {
        provider_providerRef: { provider: 'PAYSTACK', providerRef: reference },
      },
      include: { order: true },
    });
    if (!intent) return { ok: true };

    if (event === 'charge.success' && intent.status !== 'SUCCEEDED') {
      await this.wallet.postEscrowHold(
        intent.orderId,
        intent.amount,
        intent.currency,
        PaymentProvider.PAYSTACK,
        reference,
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
              provider: 'PAYSTACK',
              providerEventId: reference,
            },
          },
          data: { processedAt: new Date(), success: true },
        }),
      ]);
    }
    // handle charge.failed similarly if you want

    return { ok: true };
  }
}
