import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider } from '@prisma/client';

@Injectable()
export class ReconciliationService {
  private readonly log = new Logger(ReconciliationService.name);
  private base = process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co';
  private sk = process.env.PAYSTACK_SECRET_KEY!;

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async daily() {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      // Pull recent Paystack transactions (basic; refine with pagination later)
      const rsp = await axios.get(`${this.base}/transaction`, {
        headers: { Authorization: `Bearer ${this.sk}` },
        params: { perPage: 50 },
        timeout: 15000,
      });
      const list = rsp.data?.data ?? [];
      // Compare to success intents
      const refs = list.map((t: any) => t.reference).filter(Boolean);
      const local = await this.prisma.paymentIntent.findMany({
        where: {
          provider: PaymentProvider.PAYSTACK,
          providerRef: { in: refs },
        },
        select: { providerRef: true, status: true },
      });
      const okSet = new Set(
        local.filter((i) => i.status === 'SUCCEEDED').map((i) => i.providerRef),
      );
      const missing = refs.filter((r: string) => !okSet.has(r));

      // Store a simple reco row (optional: create a Recon table)
      this.log.log(
        `Reco: paystack=${refs.length}, local_ok=${okSet.size}, missing=${missing.length}`,
      );
    } catch (e) {
      this.log.error('Reco failed', e as any);
    }
  }
}
