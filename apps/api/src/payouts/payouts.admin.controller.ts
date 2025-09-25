import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { PayoutsService } from './payouts.service';

@Controller('admin/payouts')
@UseGuards(JwtAccessGuard)
@Roles(Role.ADMIN)
export class PayoutAdminController {
  constructor(private svc: PayoutsService) {}

  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.svc.approveAndSend(id, req.user.userId);
  }
}
