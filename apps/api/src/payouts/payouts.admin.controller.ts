import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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

  @Get()
  list(@Query('status') status?: string) {
    return this.svc['prisma'].payoutRequest.findMany({
      where: { ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { bankAccount: true, transfer: true },
    });
  }
}
