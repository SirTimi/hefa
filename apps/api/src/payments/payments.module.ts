import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsService } from './payments.service';
import { PaystackProvider } from './paystack.provider';
import { PaymentsController } from './payments.controller';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [PaymentsService, PaystackProvider, ReconciliationService],
  providers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
