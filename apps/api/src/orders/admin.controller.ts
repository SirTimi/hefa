import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { OrdersService } from './orders.service';
import { ListOrdersQuery } from './dto';

@Controller('admin/orders')
@UseGuards(JwtAccessGuard)
@Roles('ADMIN' as any)
export class AdminOrdersController {
  constructor(private svc: OrdersService) {}
  @Get()
  list(@Query() q: ListOrdersQuery) {
    return this.svc.listAll({
      take: q.take ?? 20,
      cursor: q.cursor,
      status: q.status,
    });
  }
}
