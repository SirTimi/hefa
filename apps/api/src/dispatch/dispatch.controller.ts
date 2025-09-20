import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { DispatchService } from './dispatch.service';
import { DispatchOrderDto } from './dto';
import { Role } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAccessGuard)
export class DispatchController {
  constructor(private svc: DispatchService) {}

  @Post(':id/dispatch')
  async dispatch(
    @Req() req: any,
    @Param('id') orderId: string,
    @Body() dto: DispatchOrderDto,
  ) {
    const user = req.user as { userId: string; role: Role };
    return this.svc.dispatchOrder({
      orderId,
      actorUserId: user.userId,
      asAdmin: user.role === 'ADMIN',
      pickup: {
        address: dto.pickupAddress,
        lat: dto.pickupLat,
        lng: dto.pickupLng,
      },
      dropoff: {
        address: dto.dropoffAddress,
        lat: dto.dropoffLat,
        lng: dto.dropoffLng,
      },
      maxOffers: dto.maxOffers,
      radiusKm: dto.radiusKm,
      ttlSec: dto.ttlSec,
    });
  }
}
