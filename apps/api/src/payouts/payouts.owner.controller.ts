import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
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
}
