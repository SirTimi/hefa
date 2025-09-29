import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import type { NotificationJob } from '../notifications.service';

@Injectable()
export class NotifyQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(NotifyQueueService.name);
  private conn?: IORedis;
  private queue?: Queue<NotificationJob>;
  private readonly enabled = !!process.env.REDIS_URL;

  async onModuleInit() {
    if (!this.enabled) {
      this.log.warn('REDIS_URL not set: notify queue disabled');
      return;
    }
    this.conn = new IORedis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<NotificationJob>('notify', {
      connection: this.conn,
      prefix: process.env.QUEUE_PREFIX || 'hefa',
    });
    this.log.log('NotifyQueue ready');
  }
  async onModuleDestroy() {
    await Promise.all([
      this.queue?.close().catch(() => {}),
      this.conn?.quit().catch(() => {}),
    ]);
  }

  async enqueue(job: NotificationJob, opts?: Partial<JobsOptions>) {
    if (!this.enabled || !this.queue) return { ok: false, disabled: true };
    const base: JobsOptions = {
      attempts: 5,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    };
    await this.queue.add(job.kind, job, { ...base, ...opts });
    return { ok: true };
  }
}
