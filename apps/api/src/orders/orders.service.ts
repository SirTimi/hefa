// apps/api/src/orders/orders.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DummyPaymentProvider } from '../payments/dummy.provider';
import { WalletService } from '../wallet/wallet.service';
import { AccountPurpose, AccountType, Prisma, Role } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private dummy: DummyPaymentProvider,
  ) {}

  async createOrderAuth(
    userId: string,
    asMerchant: boolean | undefined,
    currency: string,
    amount: number,
  ) {
    if (asMerchant) {
      const mp = await this.prisma.merchantProfile.findFirst({
        where: { userId, status: 'ACTIVE' },
      });
      if (!mp) throw new BadRequestException('no active merchant profile');
      return this.prisma.order.create({
        data: {
          creatorType: 'MERCHANT',
          createdByMerchantId: mp.id,
          currency,
          amount,
          status: 'DRAFT',
        },
      });
    }
    return this.prisma.order.create({
      data: {
        creatorType: 'USER',
        createdByUserId: userId,
        currency,
        amount,
        status: 'DRAFT',
      },
    });
  }
  async createOrderGuest(input: {
    currency: string;
    amount: number;
    customerName?: string;
    customerPhone: string;
    customerEmail?: string;
  }) {
    return this.prisma.order.create({
      data: { creatorType: 'GUEST', ...input, status: 'DRAFT' },
    });
  }

  private provider() {
    return this.dummy;
  }

  async createPayIntent(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('order not found');
    if (!['DRAFT', 'PENDING_PAYMENT'].includes(order.status))
      throw new BadRequestException('order not payable in current state');
    return this.provider().createIntent({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      metadata: { orderId: order.id },
    });
  }

  async createPayIntentByPublicRef(publicRef: string) {
    const order = await this.prisma.order.findUnique({ where: { publicRef } });
    if (!order) throw new NotFoundException('order not found');
    if (!['DRAFT', 'PENDING_PAYMENT'].includes(order.status))
      throw new BadRequestException('order not payable in current state');
    return this.provider().createIntent({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      metadata: { orderId: order.id, publicRef },
    });
  }
  async release(orderId: string, driverId: string, feeBps: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('order not found');
    if (order.status !== 'PAID_HELD')
      throw new BadRequestException('order not in held state');

    const fee = Math.floor((order.amount * feeBps) / 10000);
    const toDriver = order.amount - fee;
    const txnId = `REL:${order.id}`;

    await this.wallet.post(txnId, [
      {
        side: 'DEBIT',
        amount: order.amount,
        account: {
          owner: { ownerType: 'PLATFORM' },
          purpose: AccountPurpose.ESCROW, // <-- debit ESCROW (reduce liability)
          type: AccountType.LIABILITY,
          currency: order.currency,
        },
        meta: { orderId: order.id, feeBps },
      },
      {
        side: 'CREDIT',
        amount: toDriver,
        account: {
          owner: { ownerType: 'USER', ownerId: driverId },
          purpose: AccountPurpose.DRIVER_PAYABLE,
          type: AccountType.LIABILITY,
          currency: order.currency,
        },
        meta: { orderId: order.id },
      },
      {
        side: 'CREDIT',
        amount: fee,
        account: {
          owner: { ownerType: 'PLATFORM' },
          purpose: AccountPurpose.FEES,
          type: AccountType.INCOME,
          currency: order.currency,
        },
        meta: { orderId: order.id, feeBps },
      },
    ]);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'RELEASED' },
    });
    return { ok: true, fee, toDriver };
  }

  getOrderById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
    });
  }
  getOrderByPublicRef(publicRef: string) {
    return this.prisma.order.findUnique({ where: { publicRef } });
  }

  async getOrderWithCreator(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { createdByMerchant: { select: { userId: true } } },
    });
  }

  async getOrderPublicSummary(publicRef: string) {
    return this.prisma.order.findUnique({
      where: { publicRef },
      select: {
        status: true,
        amount: true,
        currency: true,
        createdByMerchant: {
          select: { id: true, userId: true, slug: true, storeName: true },
        },
      },
    });
  }

  async listForBuyer(
    userId: string,
    opts: { take?: number; cursor?: string; status?: string },
  ) {
    const take = Math.min(Math.max(opts.take ?? 20, 1), 100);
    const where: Prisma.OrderWhereInput = {
      createdByUserId: userId,
      ...(opts.status ? { status: opts.status as any } : {}),
    };
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      take,
    });
  }

  async listForSeller(
    userId: string,
    opts: { take?: number; cursor?: string; status?: string },
  ) {
    const take = Math.min(Math.max(opts.take ?? 20, 1), 100);
    const where: Prisma.OrderWhereInput = {
      createdByMerchant: { userId },
      ...(opts.status ? { status: opts.status as any } : {}),
    };
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      take,
    });
  }

  async listAll(opts: { take?: number; cursor?: string; status?: string }) {
    const take = Math.min(Math.max(opts.take ?? 20, 1), 100);
    const where: Prisma.OrderWhereInput = opts.status
      ? { status: opts.status as any }
      : {};
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      take,
    });
  }
}
