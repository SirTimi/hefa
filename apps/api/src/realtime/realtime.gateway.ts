import {
  WebSocketGateway,
  OnGatewayConnection,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

type UserPayload = { userId: string; role: 'ADMIN' | 'USER' | 'DRIVER' };

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const raw =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers['authorization'] as string)?.split(' ')[1];
      if (!raw) return client.disconnect(true);
      const payload = this.jwt.verify<UserPayload>(raw, {
        secret: process.env.JWT_SECRET,
      });
      client.data.user = payload;
      // basic rooms
      client.join(`user:${payload.userId}`);
      if (payload.role === 'DRIVER') client.join(`driver:${payload.userId}`);
      // optional: join seller rooms
      const mp = await this.prisma.merchantProfile.findMany({
        where: { userId: payload.userId },
      });
      for (const p of mp) client.join(`merchant:${p.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  // ===== Emits (call from services) =====

  offerNew(driverId: string, payload: any) {
    this.server.to(`driver:${driverId}`).emit('offer:new', payload);
  }
  offerExpired(driverId: string, payload: any) {
    this.server.to(`driver:${driverId}`).emit('offer:expired', payload);
  }
  deliveryUpdateForDriver(driverId: string, payload: any) {
    this.server.to(`driver:${driverId}`).emit('delivery:update', payload);
  }
  async deliveryUpdateForParties(deliveryId: string, payload: any) {
    const d = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: {
        assignedDriverId: true,
        order: {
          select: {
            createdByUserId: true,
            createdByMerchant: { select: { id: true, userId: true } },
          },
        },
      },
    });
    if (!d) return;
    if (d.assignedDriverId)
      this.server
        .to(`user:${d.assignedDriverId}`)
        .emit('delivery:update', payload);
    if (d.order.createdByUserId)
      this.server
        .to(`user:${d.order.createdByUserId}`)
        .emit('delivery:update', payload);
    if (d.order.createdByMerchant)
      this.server
        .to(`merchant:${d.order.createdByMerchant.id}`)
        .emit('delivery:update', payload);
  }

  driverLocation(
    driverId: string,
    coords: { lat?: number; lng?: number; at: string },
  ) {
    this.server.to(`driver:${driverId}`).emit('driver:location', coords);
  }
}
