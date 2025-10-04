import { Injectable } from '@nestjs/common';
import {
  Prisma,
  AccountPurpose,
  AccountType,
  PaymentProvider,
  JournalSide,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Owner = {
  ownerType: 'PLATFORM' | 'USER' | 'MERCHANT' | 'DRIVER';
  ownerId?: string | null;
};

type Line = {
  account: {
    owner: Owner;
    purpose: AccountPurpose;
    type: AccountType;
    currency: string;
  };
  side: 'DEBIT' | 'CREDIT';
  amount: number;
  meta?: any;
};

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  private async ensureAccount(
    owner: Owner,
    purpose: AccountPurpose,
    type: AccountType,
    currency: string,
  ) {
    // Use findFirst because ownerId can be null (Prisma's compound unique input type doesn't accept null)
    const where = {
      ownerType: owner.ownerType,
      ownerId: owner.ownerId ?? null,
      purpose,
      currency,
    };
    let acc = await this.prisma.walletAccount.findFirst({ where });
    if (acc) return acc;
    try {
      acc = await this.prisma.walletAccount.create({
        data: { ...where, type },
      });
      return acc;
    } catch (e: any) {
      // Race: someone created it; fetch again
      if (e?.code === 'P2002') {
        const again = await this.prisma.walletAccount.findFirst({ where });
        if (again) return again;
      }
      throw e;
    }
  }

  private async postTxn(
    tx: Prisma.TransactionClient,
    txnId: string,
    lines: Line[],
  ) {
    // Validate balance
    const dr = lines
      .filter((l) => l.side === 'DEBIT')
      .reduce((s, l) => s + l.amount, 0);
    const cr = lines
      .filter((l) => l.side === 'CREDIT')
      .reduce((s, l) => s + l.amount, 0);
    if (dr !== cr)
      throw new Error(`unbalanced txn ${txnId}: DR=${dr} CR=${cr}`);

    let lineNo = 1;
    for (const l of lines) {
      const acc = await this.ensureAccount(
        l.account.owner,
        l.account.purpose,
        l.account.type,
        l.account.currency,
      );
      await tx.journalEntry.create({
        data: {
          txnId,
          lineNo: lineNo++,
          accountId: acc.id,
          side: l.side as JournalSide,
          amount: l.amount,
          currency: l.account.currency,
          meta: l.meta ?? undefined,
        },
      });
    }
  }

  /** Compatibility method for legacy callers: wallet.post(txnId, lines) */
  async post(txnId: string, lines: Line[]) {
    await this.prisma.$transaction(async (tx) => {
      await this.postTxn(tx, txnId, lines);
    });
    return { ok: true };
  }

  /** Idempotent escrow HOLD after payment success. txnId = HOLD:<orderId>:<provider>:<ref> */
  async postEscrowHold(
    orderId: string,
    amount: number,
    currency: string,
    provider: PaymentProvider,
    providerRef: string,
  ) {
    const txnId = `HOLD:${orderId}:${provider}:${providerRef}`;
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.postTxn(tx, txnId, [
          {
            account: {
              owner: { ownerType: 'PLATFORM' },
              purpose: 'CASH_GATEWAY',
              type: 'ASSET',
              currency,
            },
            side: 'DEBIT',
            amount,
            meta: { orderId, provider, providerRef },
          },
          {
            account: {
              owner: { ownerType: 'PLATFORM' },
              purpose: 'ESCROW',
              type: 'LIABILITY',
              currency,
            },
            side: 'CREDIT',
            amount,
            meta: { orderId, provider, providerRef },
          },
        ]);
      });
      return { ok: true };
    } catch (e: any) {
      if (e?.code === 'P2002') return { ok: true, idempotent: true };
      throw e;
    }
  }

  /** Escrow RELEASE to merchant. txnId = REL:<orderId> */
  async releaseEscrowToMerchant(
    orderId: string,
    merchantProfileId: string,
    amount: number,
    currency: string,
  ) {
    const txnId = `REL:${orderId}`;
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.postTxn(tx, txnId, [
          {
            account: {
              owner: { ownerType: 'PLATFORM' },
              purpose: 'ESCROW',
              type: 'LIABILITY',
              currency,
            },
            side: 'DEBIT',
            amount,
            meta: { orderId, merchantProfileId },
          },
          {
            account: {
              owner: { ownerType: 'MERCHANT', ownerId: merchantProfileId },
              purpose: 'MERCHANT_RECEIVABLE',
              type: 'LIABILITY',
              currency,
            },
            side: 'CREDIT',
            amount,
            meta: { orderId, merchantProfileId },
          },
        ]);
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'RELEASED' },
        });
      });
      return { ok: true };
    } catch (e: any) {
      if (e?.code === 'P2002') return { ok: true, idempotent: true };
      throw e;
    }
  }

  /** Reverse HOLD (refund). txnId = REFUND:<orderId>:<provider>:<ref> */
  async refundToGateway(
    orderId: string,
    amount: number,
    currency: string,
    provider: PaymentProvider,
    providerRef: string,
  ) {
    const txnId = `REFUND:${orderId}:${provider}:${providerRef}`;
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.postTxn(tx, txnId, [
          {
            account: {
              owner: { ownerType: 'PLATFORM' },
              purpose: 'ESCROW',
              type: 'LIABILITY',
              currency,
            },
            side: 'DEBIT',
            amount,
            meta: { orderId, provider, providerRef },
          },
          {
            account: {
              owner: { ownerType: 'PLATFORM' },
              purpose: 'CASH_GATEWAY',
              type: 'ASSET',
              currency,
            },
            side: 'CREDIT',
            amount,
            meta: { orderId, provider, providerRef },
          },
        ]);
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });
      });
      return { ok: true };
    } catch (e: any) {
      if (e?.code === 'P2002') return { ok: true, idempotent: true };
      throw e;
    }
  }
}
