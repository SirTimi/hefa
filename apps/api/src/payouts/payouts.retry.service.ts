import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayoutsService } from './payouts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackProvider } from '../payments/paystack.provider';
import { timeStamp } from 'console';

@Injectable()
export class PayoutsRetryService {
  private readonly log = new Logger(PayoutsRetryService.name);
  private readonly maxAgeMs =
    Number(process.env.PAYOUT_PROBE_AGE_MINUTES ?? '15') * 60_000;

  constructor(
    private prisma: PrismaService,
    private paystack: PaystackProvider,
    private payouts: PayoutsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async probeSent() {
    const since = new Date(Date.now() - this.maxAgeMs);
    const stuck = await this.prisma.transfer.findMany({
      where: {
        status: 'SENT',
        createdAt: { lte: since },
      },
      take: 100,
      orderBy: { createdAt: 'asc' },
      include: { payoutRequest: true },
    });
    if (!stuck.length) return;

    this.log.log(
      `Probing ${stuck.length} SENT transers older than ${this.maxAgeMs / 60000}m`,
    );
    for (const t of stuck) {
      try {
        const verdict = await this.paystack.verifyTransferByReference(
          t.providerRef,
        );
        if (verdict === 'success') {
          await this.payouts.processTransferWebhook(
            t.providerRef,
            'transfer.success',
          );
        } else if (verdict === 'failed') {
          await this.payouts.processTransferWebhook(
            t.providerRef,
            'transfer.failed',
          );
        } else {
          this.log.debug(`Still pending rf=${t.providerRef}`);
        }
      } catch (e: any) {
        this.log.warn(`probe error ref=${t.providerRef}: ${e?.message || e}`);
      }
    }
  }
}
