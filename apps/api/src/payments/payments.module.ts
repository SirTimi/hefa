import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsService } from './payments.service';
import { PaystackProvider } from './paystack.provider';
import { PaymentsController } from './payments.controller';
import { ReconciliationService } from './reconciliation.service';
import { PayoutsModule } from '../payouts/payouts.module';
import { PaymentsWebhookController } from './webhook.controller';
import { DummyPaymentProvider } from './dummy.provider';
import { QueueModule } from '../queue/queue.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  PaystackChargeController,
  PaystackChargeWebhookController,
} from './paystack.charge.controller';

@Module({
  imports: [
    PrismaModule,
    WalletModule,
    PayoutsModule,
    QueueModule,
    NotificationsModule,
  ],
  controllers: [
    PaymentsController,
    PaymentsWebhookController,
    PaystackChargeController,
    PaystackChargeWebhookController,
  ],
  providers: [
    PaymentsService,
    PaystackProvider,
    DummyPaymentProvider,
    ReconciliationService,
  ],
  exports: [PaymentsService, DummyPaymentProvider, PaystackProvider],
})
export class PaymentsModule {}
