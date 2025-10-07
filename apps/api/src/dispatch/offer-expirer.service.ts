import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class OfferExpirerService {
  private readonly log = new Logger(OfferExpirerService.name);
  private running = false;
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run() {
    if (this.running) return; // prevent overlaps
    this.running = true;
    try {
      const now = new Date();

      // Work in small batches to keep transactions short
      const toExpire = await this.prisma.offer.findMany({
        where: { status: 'SENT', expiresAt: { lt: now } },
        select: { id: true, deliveryId: true },
        take: 200,
      });
      if (toExpire.length === 0) return;

      const ids = toExpire.map((o) => o.id);

      await this.prisma.$transaction([
        // Single UPDATE for all expired
        this.prisma.offer.updateMany({
          where: { id: { in: ids } },
          data: { status: 'EXPIRED' },
        }),
        // Single INSERT for events
        this.prisma.deliveryEvent.createMany({
          data: toExpire.map((o) => ({
            deliveryId: o.deliveryId,
            kind: 'OFFER_EXPIRED',
            at: now,
          })),
          skipDuplicates: true,
        }),
      ]);

      this.log.log(`Expired ${toExpire.length} offers`);
    } catch (e) {
      this.log.error('Offer expirer failed', e as any);
    } finally {
      this.running = false;
    }
  }
}
