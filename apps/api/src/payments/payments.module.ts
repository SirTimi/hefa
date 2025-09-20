import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { WalletModule } from '../wallet/wallet.module';
import { DummyPaymentProvider } from './dummy.provider';
import { PaymentsWebhookController } from './webhook.controller';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [PaymentsWebhookController],
  providers: [DummyPaymentProvider],
  exports: [DummyPaymentProvider],
})
export class PaymentsModule {}
