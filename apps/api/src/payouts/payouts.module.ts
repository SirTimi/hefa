import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PayoutsService } from './payouts.service';
import { PayoutsOwnerController } from './payouts.owner.controller';
import { PayoutAdminController } from './payouts.admin.controller';
import { PaystackProvider } from '../payments/paystack.provider';
import { PayoutsRetryService } from './payouts.retry.service';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
  providers: [PayoutsService, PaystackProvider, PayoutsRetryService],
  controllers: [PayoutsOwnerController, PayoutAdminController],
  exports: [PayoutsService],
})
export class PayoutsModule {}
