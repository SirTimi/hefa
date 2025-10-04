import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class OfferExpirerService {
  private readonly log = new Logger(OfferExpirerService.name);
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async run() {
    const now = new Date();
    // expire SENT offers past expiresAt
    const expired = await this.prisma.offer.findMany({
      where: { status: 'SENT', expiresAt: { lt: now } },
      select: { id: true, driverId: true, deliveryId: true },
    });
    if (expired.length === 0) return;

    await this.prisma.offer.updateMany({
      where: { id: { in: expired.map((o) => o.id) } },
      data: { status: 'EXPIRED' },
    });

    for (const o of expired)
      this.rt.offerExpired(o.driverId, {
        offerId: o.id,
        deliveryId: o.deliveryId,
      });

    // if a delivery is still OFFERING but no more SENT offers, you may choose to set it back to NEW
    await this.prisma.delivery.updateMany({
      where: {
        status: 'OFFERING',
        offers: { none: { status: 'SENT' } },
      },
      data: { status: 'NEW' },
    });

    this.log.log(`Expired ${expired.length} offers`);
  }
}
