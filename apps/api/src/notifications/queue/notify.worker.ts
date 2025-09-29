import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import type { NotificationJob } from '../notifications.service';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class NotifyWorker implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(NotifyWorker.name);
  private worker?: Worker<NotificationJob>;
  private conn?: IORedis;
  private readonly enabled = !!process.env.REDIS_URL;

  constructor(private notifications: NotificationsService) {}

  async onModuleInit() {
    if (!this.enabled) {
      this.log.warn('REDIS_URL not set: notify worker disabled');
      return;
    }
    this.conn = new IORedis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: null,
    });
    this.worker = new Worker<NotificationJob>(
      'notify',
      async (job) => {
        return this.notifications.send(job.data);
      },
      {
        connection: this.conn,
        prefix: process.env.QUEUE_PREFIX || 'hefa',
        concurrency: 10,
      },
    );
    this.worker.on('failed', (job, err) =>
      this.log.error(`notify job ${job?.id} failed: ${err?.message}`),
    );
    this.log.log('NotifyWorker ready');
  }

  async onModuleDestroy() {
    await Promise.all([
      this.worker?.close().catch(() => {}),
      this.conn?.quit().catch(() => {}),
    ]);
  }
}
