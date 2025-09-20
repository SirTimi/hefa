import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { DispatchService } from './dispatch.service';

@Controller('offers')
@UseGuards(JwtAccessGuard)
@Roles(Role.DRIVER)
export class OffersController {
  constructor(private svc: DispatchService) {}

  @Post(':id/accept')
  accept(@Req() req: any, @Param('id') id: string) {
    return this.svc.acceptOffer(id, req.user.userId);
  }

  @Post(':id/decline')
  decline(@Req() req: any, @Param('id') id: string) {
    return this.svc.declineOffer(id, req.user.userId);
  }
}
