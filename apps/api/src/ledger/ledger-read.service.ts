import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, JournalSide } from '@prisma/client';

type Balance = {
  accountId: string;
  balance: number;
  currency: string;
};

@Injectable()
export class LedgerReadService {
  constructor(private prisma: PrismaService) {}

  //Journal entries with basic filters + cursor
  entries(params: {
    txnId?: string;
    accountId?: string;
    take?: number;
    cursor?: string;
  }) {
    const take = Math.min(Math.max(params.take ?? 50, 1), 200);
    return this.prisma.journalEntry.findMany({
      where: {
        ...(params.txnId ? { txnId: params.txnId } : {}),
        ...(params.accountId ? { accountId: params.accountId } : {}),
      },
      include: { account: true },
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      take,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  //Comput signed blance per account (ASSET/EXPENSE: debit-positive; LIABILITY/INCOME: credit-positive)
  async accountBalances() {
    const accounts = await this.prisma.walletAccount.findMany();
    const entries = await this.prisma.journalEntry.findMany({
      select: {
        accountId: true,
        side: true,
        amount: true,
        currency: true,
      },
    });
    const byAcc = new Map<
      string,
      { type: AccountType; currency: string; debit: number; credit: number }
    >();
    for (const a of accounts)
      byAcc.set(a.id, {
        type: a.type,
        currency: a.currency,
        debit: 0,
        credit: 0,
      });
    for (const e of entries) {
      const acc = byAcc.get(e.accountId);
      if (!acc) continue;
      if (e.side === JournalSide.DEBIT) acc.debit += e.amount;
      else acc.credit += e.amount;
    }
    const balances: Array<Balance & { type: AccountType }> = [];
    for (const [id, v] of byAcc) {
      const signed =
        v.type === 'ASSET' || v.type === 'EXPENSE'
          ? v.debit - v.credit
          : v.credit - v.debit;
      balances.push({
        accountId: id,
        balance: signed,
        currency: v.currency,
        type: v.type,
      });
    }
    return balances;
  }

  async accountDetail(accountId: string) {
    const acc = await this.prisma.walletAccount.findUnique({
      where: { id: accountId },
    });
    if (!acc) return null;
    const lines = await this.prisma.journalEntry.findMany({
      where: { accountId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 200,
    });
    const bals = await this.accountBalances();
    const bal = bals.find((b) => b.accountId === accountId);
    return { account: acc, balance: bal?.balance ?? 0, entries: lines };
  }

  async trialBalance() {
    const bals = await this.accountBalances();
    const sum = (t: AccountType) =>
      bals
        .filter((b) => (b as any).type === t)
        .reduce((s, x) => s + x.balance, 0);
    return {
      ASSET: sum('ASSET' as any),
      LIABILITY: sum('LIABILITY' as any),
      INCOME: sum('INCOME' as any),
      EXPENSE: sum('EXPENSE' as any),
    };
  }
}
