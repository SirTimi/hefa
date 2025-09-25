import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { WalletModule } from '../wallet/wallet.module';
import { PayoutsService } from './payouts.service';
import { PayoutsOwnerController } from './payouts.owner.controller';
import { PayoutAdminController } from './payouts.admin.controller';
import { PaystackProvider } from '../payments/paystack.provider';

@Module({
  imports: [PrismaModule, WalletModule],
  providers: [PayoutsService, PaystackProvider],
  controllers: [PayoutsOwnerController, PayoutAdminController],
  exports: [PayoutsService],
})
export class PayoutsModule {}
