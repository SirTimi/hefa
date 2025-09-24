import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackProvider } from './paystack.provider';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private paystack: PaystackProvider,
    private wallet: WalletService,
  ) {}

  async createPaystackIntent(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new BadRequestException('order not found');
    if (order.status !== 'PENDING_PAYMENT')
      throw new BadRequestException('order not payable');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const email = user?.email ?? order.customerEmail ?? 'buyer@hefa.local';

    const intent = await this.prisma.paymentIntent.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.PAYSTACK,
        providerRef: 'TBD', // temp, set after init
        status: PaymentStatus.PENDING,
        amount: order.amount,
        currency: order.currency,
      },
    });

    const created = await this.paystack.createIntent({
      orderId: order.id,
      email,
      currency: order.currency,
      amount: order.amount, // already minor
      metadata: { paymentIntentId: intent.id },
    });

    // save reference
    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { providerRef: created.reference },
    });

    return {
      authorizationUrl: created.authorizationUrl,
      reference: created.reference,
      intentId: intent.id,
    };
  }

  // Called from webhook after verification
  async markSucceededByRef(reference: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { provider: 'PAYSTACK', providerRef: reference },
      include: { order: true },
    });
    if (!intent) return { ok: false, reason: 'intent-not-found' };
    if (intent.status === 'SUCCEEDED')
      return { ok: true, reason: 'idempotent' };

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentIntent.update({
        where: { id: intent.id },
        data: { status: 'SUCCEEDED' },
      });
      await tx.order.update({
        where: { id: intent.orderId },
        data: { status: 'PAID_HELD' },
      });

      // Strict/non-strict stock decrement
      const items = await tx.ordrItem.findMany({
        where: { orderId: intent.orderId },
        select: { variantId: true, quantity: true },
      });
      const allowNegative =
        (process.env.ALLOW_NEGATIVE_STOCK ?? 'true') === 'true';
      for (const it of items) {
        if (!it.variantId) continue;
        if (allowNegative) {
          await tx.productVariant.update({
            where: { id: it.variantId },
            data: { stock: { decrement: it.quantity } },
          });
        } else {
          const updated = await tx.productVariant.updateMany({
            where: { id: it.variantId, stock: { gte: it.quantity } },
            data: { stock: { decrement: it.quantity } },
          });
          if (updated.count === 0)
            throw new Error(`insufficient stock for variant ${it.variantId}`);
        }
      }
    });

    // Post ledger HOLD (idempotent on txnId)
    await this.wallet.postEscrowHold(
      intent.orderId,
      intent.amount,
      intent.currency,
      intent.provider as PaymentProvider,
      reference,
    );

    return { ok: true };
  }

  async markRefundedByRef(reference: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { provider: 'PAYSTACK', providerRef: reference },
      include: { order: true },
    });
    if (!intent)
      return {
        ok: false,
        reason: 'Intent-not-found',
      };

    //Reverse  hold only if it was succeeded/held
    if (intent.status === 'SUCCEEDED') {
      await this.wallet.refundToGateway(
        intent.orderId,
        intent.amount,
        intent.currency,
        intent.provider as PaymentProvider,
        reference,
      );
      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: 'FAILED' },
      });
    }
    return { ok: true };
  }
}
