import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AccountPurpose,
  AccountType,
  JournalSide,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type AccountSelector = {
  ownerType: string;
  ownerId?: string | null;
  purpose: AccountPurpose;
  type: AccountType;
  currency: string;
};

type PostLine = {
  account: AccountSelector;
  amount: number; // minor units
  side: JournalSide;
  meta?: Record<string, any>;
};

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  private normalize(sel: AccountSelector) {
    const ownerId =
      sel.ownerId ?? (sel.ownerType === 'PLATFORM' ? 'PLATFORM' : undefined);
    if (!ownerId) {
      throw new BadRequestException(
        `ownerId required for ownerType=${sel.ownerType}`,
      );
    }
    return { ...sel, ownerId };
  }

  async getOrCreateAccount(sel: AccountSelector) {
    const s = this.normalize(sel);
    return this.prisma.walletAccount.upsert({
      where: {
        ownerType_ownerId_purpose_currency: {
          ownerType: s.ownerType,
          ownerId: s.ownerId ?? null, // <— normalize to null
          purpose: s.purpose,
          currency: s.currency,
        },
      },
      create: {
        ownerType: s.ownerType,
        ownerId: s.ownerId ?? null, // <— normalize to null
        purpose: s.purpose,
        type: s.type,
        currency: s.currency,
      },
      update: {},
    });
  }

  async post(txnId: string, lines: PostLine[]) {
    if (!lines.length) throw new BadRequestException('empty journal');

    // currency consistency
    const ccy = lines[0].account.currency;
    if (!lines.every((l) => l.account.currency === ccy)) {
      throw new BadRequestException('mixed currencies not allowed');
    }

    // sum(debits) == sum(credits)
    const sum = (side: JournalSide) =>
      lines.filter((l) => l.side === side).reduce((a, b) => a + b.amount, 0);
    if (sum(JournalSide.DEBIT) !== sum(JournalSide.CREDIT)) {
      throw new BadRequestException('unbalanced journal');
    }

    // assign line numbers 1..n
    const prepared = await Promise.all(
      lines.map(async (l, idx) => {
        const acc = await this.getOrCreateAccount(l.account);
        return {
          txnId,
          lineNo: idx + 1,
          accountId: acc.id,
          side: l.side,
          amount: l.amount,
          currency: ccy,
          meta: l.meta as Prisma.InputJsonValue,
        };
      }),
    );

    // insert atomically; if txnId duplicates, fail
    await this.prisma.$transaction(async (tx) => {
      // sanity: ensure no existing lines with same txnId
      const existing = await tx.journalEntry.findFirst({ where: { txnId } });
      if (existing) throw new BadRequestException('duplicate txnId');
      for (const row of prepared) {
        await tx.journalEntry.create({ data: row });
      }
    });

    return { ok: true, lines: prepared.length };
  }
}
