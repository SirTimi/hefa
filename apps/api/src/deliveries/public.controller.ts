import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public/deliveries')
export class PublicDeliveryController {
  constructor(private prisma: PrismaService) {}

  @Get(':id/status')
  async status(@Param('id') id: string) {
    const d = await this.prisma.delivery.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        pickedUpAt: true,
        deliveredAt: true,
        pickupAddress: true,
        dropoffAddress: true,
        assignedDriverId: true,
        order: {
          select: {
            amount: true,
            currency: true,
            createdByMerchant: { select: { storeName: true, slug: true } },
          },
        },
      },
    });
    if (!d) return { status: 'NOT_FOUND' };

    let driver = null;
    if (d.assignedDriverId) {
      const p = await this.prisma.driverPresence.findUnique({
        where: { driverId: d.assignedDriverId },
      });
      driver = p
        ? { lat: Number(p.lat), lng: Number(p.lng), lastSeenAt: p.lastSeenAt }
        : null;
    }

    return {
      deliveryId: d.id,
      status: d.status,
      pickedUpAt: d.pickedUpAt,
      deliveredAt: d.deliveredAt,
      pickupAddress: d.pickupAddress,
      dropoffAddress: d.dropoffAddress,
      merchant: d.order.createdByMerchant,
      driver,
    };
  }
}
