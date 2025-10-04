import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Wallet')
@ApiBearerAuth('bearer')
@Controller('wallet')
@UseGuards(JwtAccessGuard)
export class WalletReadController {
  constructor(private prisma: PrismaService) {}

  //RETURNS SIGNED BALANCES PER ACCOUNT FOR AN OWNER
  @Get('balances')
  async balances(
    @Query('ownerType') ownerType: 'MERCHANT' | 'DRIVER' | 'USER' | 'PLATFORM',
    @Query('ownerId') ownerId?: string,
    @Query('currency') currency = 'NGN',
  ) {
    const accts = await this.prisma.walletAccount.findMany({
      where: { ownerType, ownerId: ownerId ?? null, currency },
    });
    const entries = await this.prisma.journalEntry.findMany({
      where: { accountId: { in: accts.map((a) => a.id) } },
    });
    const byId = new Map(
      accts.map((a) => [a.id, { account: a, dr: 0, cr: 0 }]),
    );
    for (const e of entries) {
      const b = byId.get(e.accountId);
      if (!b) continue;
      if (e.side === 'DEBIT') b.dr += e.amount;
      else b.cr += e.amount;
    }
    return [...byId.values()].map(({ account, dr, cr }) => {
      //Liability/Income: credit-positive; Asset/Expense: debit-positive
      const sign =
        account.type === 'ASSET' || account.type === 'EXPENSE'
          ? dr - cr
          : cr - dr;
      return { account, balance: sign };
    });
  }
}
