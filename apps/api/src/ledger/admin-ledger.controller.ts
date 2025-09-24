import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { LedgerReadService } from './ledger-read.service';

@Controller('admin/ledger')
@UseGuards(JwtAccessGuard)
@Roles(Role.ADMIN)
export class AdminLedgerController {
  constructor(private svc: LedgerReadService) {}

  @Get('entries')
  list(
    @Query('txnId') txnId?: string,
    @Query('accountId') accountId?: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.svc.entries({
      txnId,
      accountId,
      take: take ? parseInt(take, 10) : undefined,
      cursor,
    });
  }

  @Get('accounts')
  balances() {
    return this.svc.accountBalances();
  }

  @Get('accounts/:id')
  account(@Param('id') id: string) {
    return this.svc.accountDetail(id);
  }

  @Get('trial-balance')
  tb() {
    return this.svc.trialBalance();
  }
}
