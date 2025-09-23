import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { MerchantKycService } from './merchant-kyc.service';

class MerchantKycDto {
  merchantProfileId!: string;
  contactName!: string;
  businessName?: string;
  taxId?: string;
  address?: string;
  docUrl?: string;
}

@Controller('merchant/kyc')
@UseGuards(JwtAccessGuard)
export class MerchantKycController {
  constructor(private svc: MerchantKycService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.svc.me(req.user.userId);
  }

  @Post('submit')
  submit(@Req() req: any, @Body() body: MerchantKycDto) {
    return this.svc.submit(req.user.userId, body);
  }
}
