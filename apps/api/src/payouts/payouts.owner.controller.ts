import {
  Body,
  Controller,
  Get,
  Query,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { PayoutsService } from './payouts.service';

@Controller('payouts')
@UseGuards(JwtAccessGuard)
export class PayoutsOwnerController {
  constructor(private svc: PayoutsService) {}

  // Generic: ownerType in body ('MERCHANT' | 'DRIVER')
  @Post('bank-accounts')
  upsertBank(
    @Req() req: any,
    @Body()
    b: {
      ownerType: 'MERCHANT' | 'DRIVER';
      ownerId?: string;
      bankCode: string;
      accountNo: string;
      accountName?: string;
      isDefault?: boolean;
    },
  ) {
    const userId = req.user.userId as string;
    if (b.ownerType === 'DRIVER') {
      return this.svc.upsertBankAccount('DRIVER', userId, {
        bankCode: b.bankCode,
        accountNo: b.accountNo,
        accountName: b.accountName,
        isDefault: b.isDefault,
      });
    }
    // MERCHANT: ownerId = merchantProfileId (must belong to user)
    if (!b.ownerId) throw new Error('merchantProfileId required');
    return this.svc.upsertBankAccount('MERCHANT', b.ownerId, {
      bankCode: b.bankCode,
      accountNo: b.accountNo,
      accountName: b.accountName,
      isDefault: b.isDefault,
    });
  }

  @Post('requests')
  request(
    @Req() req: any,
    @Body()
    b: {
      ownerType: 'MERCHANT' | 'DRIVER';
      ownerId?: string;
      bankAccountId: string;
      amount: number;
      currency: string;
    },
  ) {
    const userId = req.user.userId as string;
    if (b.ownerType === 'DRIVER')
      return this.svc.request(
        'DRIVER',
        userId,
        userId,
        b.bankAccountId,
        b.amount,
        b.currency,
      );
    if (!b.ownerId) throw new Error('merchantProfileId required');
    return this.svc.request(
      'MERCHANT',
      b.ownerId,
      userId,
      b.bankAccountId,
      b.amount,
      b.currency,
    );
  }

  @Get('requests/list')
  listMine(
    @Query('ownerType') ownerType: 'MERCHANT' | 'DRIVER',
    @Query('ownerId') ownerId?: string,
  ) {
    if (ownerType === 'DRIVER') {
      return this.svc['prisma'].payoutRequest.findMany({
        where: {
          ownerType: 'DRIVER',
          ownerId: (this as any).req?.user?.userId,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }
    if (!ownerId) throw new Error('merchantProfileId required');
    return this.svc['prisma'].payoutRequest.findMany({
      where: { ownerType: 'MERCHANT', ownerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
