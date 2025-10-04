import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { Role, KycStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DriverKycService } from './driver-kyc.service';
import { MerchantKycService } from './merchant-kyc.service';
import { AuditService } from '../audit/audit.service';

class ReviewDto {
  note?: string;
}

@Controller('admin/kyc')
@UseGuards(JwtAccessGuard)
@Roles(Role.ADMIN)
export class AdminKycController {
  constructor(
    private prisma: PrismaService,
    private driverSvc: DriverKycService,
    private merchantSvc: MerchantKycService,
    private audit: AuditService,
  ) {}

  @Get('drivers')
  listDrivers(@Query('status') status?: KycStatus) {
    return this.prisma.driverKyc.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get('merchants')
  listMerchants(@Query('status') status?: KycStatus) {
    return this.prisma.merchantKyc.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'asc' },
      include: { merchantProfile: { select: { storeName: true, slug: true } } },
    });
  }

  @Post('drivers/:id/approve')
  approveDriver(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ReviewDto,
  ) {
    return this.driverSvc.approve(id, req.user.userId, body.note);
  }
  @Post('drivers/:id/reject')
  rejectDriver(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ReviewDto,
  ) {
    return this.driverSvc.reject(id, req.user.userId, body.note);
  }

  @Post('merchants/:id/approve')
  approveMerchant(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ReviewDto,
  ) {
    return this.merchantSvc.approve(id, req.user.userId, body.note);
  }
  @Post('merchants/:id/reject')
  rejectMerchant(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: ReviewDto,
  ) {
    return this.merchantSvc.reject(id, req.user.userId, body.note);
  }
}
