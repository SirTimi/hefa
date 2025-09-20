import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { DriverService } from './driver.service';

class CoordsDto {
  lat?: number;
  lng?: number;
}

@Controller('driver')
@UseGuards(JwtAccessGuard)
@Roles(Role.DRIVER)
export class DriverController {
  constructor(private svc: DriverService) {}

  @Post('presence/online')
  online(@Req() req: any, @Body() body: CoordsDto) {
    return this.svc.setOnline(req.user.userId, body.lat, body.lng);
  }

  @Post('presence/offline')
  offline(@Req() req: any) {
    return this.svc.setOffline(req.user.userId);
  }

  @Post('presence/heartbeat')
  heartbeat(@Req() req: any, @Body() body: CoordsDto) {
    return this.svc.heartbeat(req.user.userId, body.lat, body.lng);
  }

  @Get('deliveries')
  deliveries(
    @Req() req: any,
    @Query('status') status: 'active' | 'history' = 'active',
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    const n = take ? parseInt(take, 10) : 20;
    return this.svc.listDeliveries(req.user.userId, status, n, cursor);
  }
}
