import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, OfferStatus, DeliveryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

@Injectable()
export class DispatchService {
  constructor(
    private prisma: PrismaService,
    private rt: RealtimeGateway,
  ) {}

  async dispatchOrder(params: {
    orderId: string;
    actorUserId: string;
    asAdmin: boolean;
    pickup?: { address?: string; lat?: number; lng?: number };
    dropoff?: { address?: string; lat?: number; lng?: number };
    maxOffers?: number;
    radiusKm?: number;
    ttlSec?: number;
  }) {
    const { orderId, actorUserId, asAdmin } = params;
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { createdByMerchant: { select: { userId: true } } },
    });
    if (!order) throw new NotFoundException('order not found');

    // authorization: admin OR buyer OR seller
    const isBuyer =
      !!order.createdByUserId && order.createdByUserId === actorUserId;
    const isSeller =
      !!order.createdByMerchant?.userId &&
      order.createdByMerchant.userId === actorUserId;
    if (!asAdmin && !isBuyer && !isSeller)
      throw new BadRequestException('not allowed to dispatch this order');

    // simple precondition (relax as needed)
    if (order.status === 'RELEASED')
      throw new BadRequestException('already completed');

    const now = Date.now();
    const maxOffers = params.maxOffers ?? 10;
    const radiusKm = params.radiusKm ?? 20;
    const ttlSec = params.ttlSec ?? 60;

    // Presence window: seen in last 5 minutes, with coords and online
    const seenSince = new Date(now - 5 * 60 * 1000);
    const presences = await this.prisma.driverPresence.findMany({
      where: {
        online: true,
        lastSeenAt: { gte: seenSince },
        lat: { not: null },
        lng: { not: null },
      },
      select: { driverId: true, lat: true, lng: true },
    });

    // Require pickup coords to rank drivers
    const pk = params.pickup;
    if (!pk?.lat || !pk?.lng)
      throw new BadRequestException('pickupLat/lng required to dispatch');

    // rank by distance
    const ranked = presences
      .map((p) => ({
        driverId: p.driverId,
        distKm: haversineKm(pk.lat!, pk.lng!, Number(p.lat), Number(p.lng)),
      }))
      .filter((x) => x.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, maxOffers);

    if (ranked.length === 0)
      throw new BadRequestException('no nearby online drivers');

    const expiresAt = new Date(now + ttlSec * 1000);

    // Transaction: create Delivery + Offers + Event
    const result = await this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.create({
        data: {
          orderId,
          status: 'OFFERING',
          pickupAddress: pk.address,
          pickupLat: pk.lat ? new Prisma.Decimal(pk.lat) : null,
          pickupLng: pk.lng ? new Prisma.Decimal(pk.lng) : null,
          dropoffAddress: params.dropoff?.address,
          dropoffLat: params.dropoff?.lat
            ? new Prisma.Decimal(params.dropoff.lat)
            : null,
          dropoffLng: params.dropoff?.lng
            ? new Prisma.Decimal(params.dropoff.lng)
            : null,
        },
      });

      await tx.offer.createMany({
        data: ranked.map((r) => ({
          deliveryId: delivery.id,
          driverId: r.driverId,
          status: 'SENT',
          expiresAt,
        })),
        skipDuplicates: true,
      });

      await tx.deliveryEvent.create({
        data: {
          deliveryId: delivery.id,
          actorUserId,
          kind: 'OFFER_SENT',
          data: { count: ranked.length },
          at: new Date(),
        },
      });

      return delivery;
    });

    const createdOffers = await this.prisma.offer.findMany({
      where: { deliveryId: result.id },
      select: { id: true, driverId: true, expiresAt: true, deliveryId: true },
    });
    for (const o of createdOffers) {
      this.rt.offerNew(o.driverId, {
        offerId: o.id,
        deliveryId: o.deliveryId,
        expiresAt: o.expiresAt,
      });
    }
    return {
      ok: true,
      deliveryId: result.id,
      offers: ranked.length,
      expiresAt,
    };
  }

  async acceptOffer(offerId: string, driverId: string) {
    // find offer + delivery
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException('offer not found');
    if (offer.driverId !== driverId)
      throw new BadRequestException('not your offer');
    if (offer.status !== 'SENT')
      throw new BadRequestException('offer not available');
    if (offer.expiresAt < new Date())
      throw new BadRequestException('offer expired');

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: offer.deliveryId },
    });
    if (!delivery) throw new NotFoundException('delivery missing');

    // race-safe assignment: updateMany with guard (assignedDriverId null + status OFFERING/NEW)
    const assigned = await this.prisma.$transaction(async (tx) => {
      const active = await tx.delivery.count({
        where: {
          assignedDriverId: driverId,
          status: { in: ['ASSIGNED', 'PICKED_UP'] },
        },
      });
      if (active > 0)
        throw new BadRequestException('you already have an active delivery');

      const res = await tx.delivery.updateMany({
        where: {
          id: delivery.id,
          assignedDriverId: null,
          status: { in: ['NEW', 'OFFERING'] },
        },
        data: { assignedDriverId: driverId, status: 'ASSIGNED' },
      });
      if (res.count === 0) return false;

      // mark winner + expire others
      await tx.offer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED' },
      });
      await tx.offer.updateMany({
        where: {
          deliveryId: delivery.id,
          id: { not: offerId },
          status: 'SENT',
        },
        data: { status: 'EXPIRED' },
      });

      const dNow = await tx.delivery.findUnique({ where: { id: delivery.id } });
      if (!dNow?.podCode) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await tx.delivery.update({
          where: { id: delivery.id },
          data: { podCode: code },
        });
      }
      await tx.deliveryEvent.create({
        data: {
          deliveryId: delivery.id,
          actorUserId: driverId,
          kind: 'OFFER_ACCEPTED',
          data: { offerId },
          at: new Date(),
        },
      });
      await tx.deliveryEvent.create({
        data: {
          deliveryId: delivery.id,
          actorUserId: driverId,
          kind: 'DRIVER_ASSIGNED',
          data: { driverId },
          at: new Date(),
        },
      });
      return true;
    });

    if (!assigned)
      throw new BadRequestException('too late—another driver already accepted');
    this.rt.deliveryUpdateForDriver(driverId, {
      deliveryId: delivery.id,
      status: 'ASSIGNED',
    });
    await this.rt.deliveryUpdateForParties(delivery.id, {
      deliveryId: delivery.id,
      status: 'ASSIGNED',
    });

    // ALSO NOTIFY LOSERS
    const losers = await this.prisma.offer.findMany({
      where: { deliveryId: delivery.id, status: 'EXPIRED' },
      select: { driverId: true, id: true },
    });
    for (const l of losers)
      this.rt.offerExpired(l.driverId, {
        offerId: l.id,
        deliveryId: delivery.id,
      });
    return { ok: true, deliveryId: delivery.id };
  }

  async declineOffer(offerId: string, driverId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
    });
    if (!offer) throw new NotFoundException('offer not found');
    if (offer.driverId !== driverId)
      throw new BadRequestException('not your offer');
    if (offer.status !== 'SENT') return { ok: true }; // already resolved
    if (offer.expiresAt < new Date()) {
      await this.prisma.offer.update({
        where: { id: offerId },
        data: { status: 'EXPIRED' },
      });
      return { ok: true };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id: offerId },
        data: { status: 'DECLINED' },
      });
      await tx.deliveryEvent.create({
        data: {
          deliveryId: offer.deliveryId,
          actorUserId: driverId,
          kind: 'OFFER_DECLINED',
          data: { offerId },
          at: new Date(),
        },
      });
    });
    return { ok: true };
  }
}
