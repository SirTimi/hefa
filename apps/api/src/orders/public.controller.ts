import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateGuestOrderDto } from './dto';

@Controller('public/orders')
export class PublicOrdersController {
  constructor(private svc: OrdersService) {}

  @Post()
  async createGuest(@Body() dto: CreateGuestOrderDto) {
    const order = await this.svc.createOrderGuest(dto);
    return {
      orderId: order.id,
      publicRef: order.publicRef,
      status: order.status,
    };
  }

  @Post(':publicRef/pay-intent')
  @HttpCode(200)
  payIntentPublic(@Param('publicRef') publicRef: string) {
    return this.svc.createPayIntentByPublicRef(publicRef);
  }

  @Get(':publicRef')
  async getPublic(@Param('publicRef') publicRef: string) {
    const o = await this.svc.getOrderPublicSummary(publicRef);
    if (!o) return { status: 'NOT_FOUND' };
    return {
      status: o.status,
      amount: o.amount,
      currency: o.currency,
      seller: o.createdByMerchant
        ? {
            merchantProfileId: o.createdByMerchant.id,
            merchantUserId: o.createdByMerchant.userId,
            storeName: o.createdByMerchant.storeName,
            slug: o.createdByMerchant.slug,
          }
        : null,
    };
  }
}
