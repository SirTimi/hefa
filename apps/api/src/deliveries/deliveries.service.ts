import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

function genCode6() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class DeliveriesService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  private async getForDriver(deliveryId: string, driverId: string) {
    const d = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });
    if (!d) throw new NotFoundException('delivery not found');
    if (d.assignedDriverId !== driverId)
      throw new BadRequestException('not your delivery');
    return d;
  }

  // called after offer ACCEPT succeeds; safe if already has code
  async ensurePodCode(deliveryId: string) {
    const d = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });
    if (!d) throw new NotFoundException('delivery missing');
    if (!d.podCode) {
      await this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { podCode: genCode6() },
      });
    }
  }

  async arrived(deliveryId: string, driverId: string, note?: string) {
    const d = await this.getForDriver(deliveryId, driverId);
    await this.prisma.deliveryEvent.create({
      data: {
        deliveryId,
        actorUserId: driverId,
        kind: 'DRIVER_ARRIVED',
        data: note ? { note } : undefined,
      },
    });
    return { ok: true };
  }

  async pickedUp(deliveryId: string, driverId: string, note?: string) {
    const d = await this.getForDriver(deliveryId, driverId);
    if (d.status !== 'ASSIGNED')
      throw new BadRequestException('must be ASSIGNED to mark picked up');
    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: { status: 'PICKED_UP', pickedUpAt: new Date() },
      });
      await tx.deliveryEvent.create({
        data: {
          deliveryId,
          actorUserId: driverId,
          kind: 'PICKED_UP',
          data: note ? { note } : undefined,
        },
      });
    });
    await this.rt.deliveryUpdateForDriver(driverId, {
      deliveryId,
      status: 'PICKED_UP',
    });
    await this.rt.deliveryUpdateForParties(deliveryId, {
      deliveryId,
      status: 'PICKED_UP',
    });
    return { ok: true };
  }

  async delivered(
    deliveryId: string,
    driverId: string,
    code: string,
    recipientName?: string,
    recipientPhotoUrl?: string,
  ) {
    const d = await this.getForDriver(deliveryId, driverId);
    if (d.status !== 'PICKED_UP')
      throw new BadRequestException('must be PICKED_UP to mark delivered');
    if (!d.podCode) throw new BadRequestException('PoD code not set');
    if (code !== d.podCode) throw new BadRequestException('invalid PoD code');

    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          podVerifiedAt: new Date(),
          recipientName: recipientName ?? d.recipientName,
          recipientPhotoUrl: recipientPhotoUrl ?? d.recipientPhotoUrl,
        },
      });
      await tx.deliveryEvent.create({
        data: {
          deliveryId,
          actorUserId: driverId,
          kind: 'DELIVERED',
          data: { recipientName, recipientPhotoUrl },
        },
      });
    });
    await this.rt.deliveryUpdateForDriver(driverId, {
      deliveryId,
      status: 'DELIVERED',
    });
    await this.rt.deliveryUpdateForParties(deliveryId, {
      deliveryId,
      status: 'DELIVERED',
    });
    return { ok: true };
  }
}
