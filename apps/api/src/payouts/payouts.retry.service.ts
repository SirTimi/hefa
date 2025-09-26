import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackProvider } from '../payments/paystack.provider';

@Injectable()
export class PayoutsRetryService {
  private readonly log = new Logger(PayoutsRetryService.name);
  constructor(
    private prisma: PrismaService,
    private paystack: PaystackProvider,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async probeSent() {
    const sent = await this.prisma.transfer.findMany({
      where: { status: 'SENT' },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });
    for (const t of sent) {
      try {
        // Paystack doesn’t have a single "get transfer by reference" endpoint in all plans;
        // commonly you re-list or store webhook. For now, rely on webhook;
        // if stuck > 2h, flag for manual review.
        const age = Date.now() - new Date(t.createdAt).getTime();
        if (age > 2 * 60 * 60 * 1000) {
          this.log.warn(`Transfer stuck >2h ref=${t.providerRef}`);
        }
      } catch (e) {
        this.log.error(`probeSent failed ref=${t.providerRef}`);
      }
    }
  }
}
