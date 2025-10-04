import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PaymentsService } from '../payments/payments.service';
import { PayoutsService } from '../payouts/payouts.service';
import type { ReplayJob } from './queue.service';

@Injectable()
export class WebhookWorker implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(WebhookWorker.name);
  private worker?: Worker<ReplayJob>;
  private conn?: IORedis;
  private readonly enabled = !!process.env.REDIS_URL;

  constructor(
    private payments: PaymentsService,
    private payouts: PayoutsService,
  ) {}

  async onModuleInit() {
    if (!this.enabled) {
      this.log.warn('REDIS_URL not set: worker disabled');
      return;
    }
    this.conn = new IORedis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: null,
    });
    this.worker = new Worker<ReplayJob>(
      'webhook-retry',
      async (job) => {
        const d = job.data;
        this.log.log(`Processing ${job.name} ${JSON.stringify(d)}`);
        if (d.kind === 'payments.charge.success')
          return this.payments.markSucceededByRef(d.reference);
        if (d.kind === 'payments.refund')
          return this.payments.markRefundedByRef(d.reference);
        if (d.kind === 'payouts.transfer.success')
          return this.payouts.processTransferWebhook(
            d.reference,
            'transfer.success',
          );
        if (d.kind === 'payouts.transfer.failed')
          return this.payouts.processTransferWebhook(
            d.reference,
            'transfer.failed',
          );
        throw new Error('unknown job kind');
      },
      {
        connection: this.conn,
        prefix: process.env.QUEUE_PREFIX || 'hefa',
        concurrency: 5,
      },
    );
    this.worker.on('failed', (job, err) =>
      this.log.error(`Job ${job?.id} failed: ${err?.message}`),
    );
    this.log.log('WebhookWorker ready');
  }

  async onModuleDestroy() {
    await Promise.all([
      this.worker?.close().catch(() => {}),
      this.conn?.quit().catch(() => {}),
    ]);
  }
}
