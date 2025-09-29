import { Module } from '@nestjs/common';
import { WebhookWorker } from './webhook.worker';
import { PaymentsModule } from '../payments/payments.module';
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [PaymentsModule, PayoutsModule],
  providers: [WebhookWorker],
})
export class WebhookWorkerModule {}
