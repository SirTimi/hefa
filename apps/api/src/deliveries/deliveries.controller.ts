import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { DeliveriesService } from './deliveries.service';
import { ArrivedDto, DeliverDto, PickedUpDto } from './dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Deliveries')
@ApiBearerAuth('bearer')
@Controller('deliveries')
@UseGuards(JwtAccessGuard)
@Roles(Role.DRIVER)
export class DeliveriesController {
  constructor(private svc: DeliveriesService) {}

  @Post(':id/arrived')
  arrived(@Req() req: any, @Param('id') id: string, @Body() body: ArrivedDto) {
    return this.svc.arrived(id, req.user.userId, body.note);
  }

  @Post(':id/pickup')
  pickup(@Req() req: any, @Param('id') id: string, @Body() body: PickedUpDto) {
    return this.svc.pickedUp(id, req.user.userId, body.note);
  }

  @Post(':id/deliver')
  deliver(@Req() req: any, @Param('id') id: string, @Body() body: DeliverDto) {
    return this.svc.delivered(
      id,
      req.user.userId,
      body.code,
      body.recipientName,
      body.recipientPhotoUrl,
    );
  }
}
