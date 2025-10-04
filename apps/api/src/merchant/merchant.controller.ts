import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { MerchantService } from './merchant.service';

@Controller('merchant/me')
@UseGuards(JwtAccessGuard)
export class MerchantController {
  constructor(private svc: MerchantService) {}

  @Get() getMine(@Req() req: any) {
    return this.svc.getMyProfile(req.user.userId);
  }

  @Post() create(@Req() req: any, @Body() body: { storeName: string }) {
    return this.svc.createMyProfile(req.user.userId, body.storeName);
  }

  @Post('activate') activate(@Req() req: any) {
    return this.svc.activateMyProfile(req.user.userId);
  }
}
