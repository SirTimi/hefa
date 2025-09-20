import { Injectable } from '@nestjs/common';
import { Prisma, DeliveryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class DriverService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  async setOnline(driverId: string, lat?: number, lng?: number) {
    return this.prisma.driverPresence.upsert({
      where: { driverId },
      create: { driverId, online: true, lat, lng, lastSeenAt: new Date() },
      update: { online: true, lat, lng, lastSeenAt: new Date() },
    });
  }

  async setOffline(driverId: string) {
    return this.prisma.driverPresence.upsert({
      where: { driverId },
      create: { driverId, online: false, lastSeenAt: new Date() },
      update: { online: false, lastSeenAt: new Date() },
    });
  }

  async heartbeat(driverId: string, lat?: number, lng?: number) {
    const row = await this.prisma.driverPresence
      .update({
        where: { driverId },
        data: {
          lastSeenAt: new Date(),
          ...(lat !== undefined ? { lat } : {}),
          ...(lng !== undefined ? { lng } : {}),
        },
      })
      .catch(async () => {
        // if presence row not created yet, create online on first heartbeat
        return this.prisma.driverPresence.create({
          data: { driverId, online: true, lat, lng },
        });
      });
    this.rt.driverLocation(driverId, {
      lat: Number(row.lat),
      lng: Number(row.lng),
      at: new Date().toISOString(),
    });
    return row;
  }

  async listDeliveries(
    driverId: string,
    status: 'active' | 'history',
    take = 20,
    cursor?: string,
  ) {
    const where: Prisma.DeliveryWhereInput =
      status === 'active'
        ? {
            assignedDriverId: driverId,
            status: { in: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP] },
          }
        : {
            assignedDriverId: driverId,
            status: {
              in: [DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED],
            },
          };

    return this.prisma.delivery.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdByUserId: true,
            createdByMerchant: {
              select: { id: true, storeName: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: Math.min(Math.max(take, 1), 100),
    });
  }
}
