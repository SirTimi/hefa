import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import IORedis, { RedisOptions } from 'ioredis';

export type ReplayJob =
  | { kind: 'payments.charge.success' | 'payments.refund'; reference: string }
  | {
      kind: 'payouts.transfer.success' | 'payouts.transfer.failed';
      reference: string;
    };

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(QueueService.name);
  private conn?: IORedis;
  private queue?: Queue<ReplayJob>;
  public readonly enabled: boolean;

  constructor() {
    this.enabled = !!process.env.REDIS_URL;
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.log.warn('REDIS_URL not set: queues disabled');
      return;
    }
    this.conn = new IORedis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue<ReplayJob>('webhook-retry', {
      connection: this.conn,
      prefix: process.env.QUEUE_PREFIX || 'hefa',
    });
    this.log.log('QueueService ready');
  }

  async onModuleDestroy() {
    await Promise.all([
      this.queue?.close().catch(() => {}),
      this.conn?.quit().catch(() => {}),
    ]);
  }

  /** Add a replay job with exponential backoff. No-op if disabled. */
  async enqueueReplay(data: ReplayJob, opts?: Partial<JobsOptions>) {
    if (!this.enabled || !this.queue) return { ok: false, disabled: true };
    const base: JobsOptions = {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    };
    await this.queue.add(data.kind, data, { ...base, ...opts });
    return { ok: true };
  }
}
