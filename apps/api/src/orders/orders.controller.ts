import {
  Body,
  Query,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  CreatePayIntentDto,
  ListOrdersQuery,
  OrderScope,
  ReleaseDto,
} from './dto';
import { PoliciesService } from '../policy/policies.service';
import { Roles } from '../auth/guards';

@Controller('orders')
@UseGuards(JwtAccessGuard)
export class OrdersController {
  constructor(
    private svc: OrdersService,
    private policies: PoliciesService,
  ) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    const { userId } = req.user;
    // asMerchant?: boolean — if true, we use the caller’s ACTIVE MerchantProfile
    return this.svc.createOrderAuth(
      userId,
      dto.asMerchant,
      dto.currency,
      dto.amount,
    );
  }
  @Get()
  async list(@Req() req: any, @Query() q: ListOrdersQuery) {
    const { userId, role } = req.user;
    const take = q.take ?? 20;
    if (q.scope === OrderScope.SELLER) {
      return this.svc.listForSeller(userId, {
        take,
        cursor: q.cursor,
        status: q.status,
      });
    }
    // Admin convenience: allow ?scope=all to fetch everything
    if ((q as any).scope === 'all' && role === 'ADMIN') {
      return this.svc.listAll({ take, cursor: q.cursor, status: q.status });
    }
    // default buyer view
    return this.svc.listForBuyer(userId, {
      take,
      cursor: q.cursor,
      status: q.status,
    });
  }
  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    const order = await this.svc.getOrderWithCreator(id);
    if (!order) return order;
    const allowed = this.policies.canReadOrder(req.user, {
      id: order.id,
      createdByUserId: order.createdByUserId,
      createdByMerchant: order.createdByMerchant
        ? { userId: order.createdByMerchant.userId }
        : null,
    });
    if (!allowed) {
      // mirror NestJS Forbidden without pulling in extra deps
      return { statusCode: 403, message: 'Forbidden' };
    }
    return order;
  }

  @Post(':id/pay-intent')
  payIntent(@Param('id') id: string, @Body() _dto: CreatePayIntentDto) {
    return this.svc.createPayIntent(id);
  }

  // ADMIN ONLY for now (until PoD/dispatch)
  @Post(':id/release')
  @Roles('ADMIN' as any) // typed Role enum under the hood
  release(@Req() req: any, @Param('id') id: string, @Body() dto: ReleaseDto) {
    // RolesGuard enforces ADMIN; PoliciesService can be used if you relax later
    return this.svc.release(id, dto.driverId, dto.feeBps);
  }
}
