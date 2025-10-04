import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { DriverKycService } from './driver-kyc.service';

class DriverKycDto {
  fullName!: string;
  idNumber!: string;
  licenseNumber!: string;
  licenseExpiry?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  idDocUrl?: string;
  licenseDocUrl?: string;
  selfieUrl?: string;
}

@Controller('driver/kyc')
@UseGuards(JwtAccessGuard)
export class DriverKycController {
  constructor(private svc: DriverKycService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.svc.me(req.user.userId);
  }

  @Post('submit')
  submit(@Req() req: any, @Body() body: DriverKycDto) {
    return this.svc.submit(req.user.userId, body);
  }
}
