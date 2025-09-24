import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderFromVariantsDto } from './create-from-variants.dto';
import { CreatorType, OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrdersFromVariantsController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAccessGuard) // allow guest? add a separate public route if needed later
  @Post('from-variants')
  async create(@Req() req: any, @Body() dto: CreateOrderFromVariantsDto) {
    if (!dto.items?.length) throw new BadRequestException('no items');

    // Load variants and verify consistency
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: dto.items.map((i) => i.variantId) }, active: true },
      include: { product: { select: { merchantProfileId: true } } },
    });
    if (variants.length !== dto.items.length)
      throw new BadRequestException('some variants not found/active');

    const merchantIds = new Set(
      variants.map((v) => v.product.merchantProfileId),
    );
    if (merchantIds.size !== 1)
      throw new BadRequestException('variants must belong to one merchant');

    // compute total from DB prices
    const byId = new Map(variants.map((v) => [v.id, v]));
    let currency = variants[0].currency;
    let amount = 0;
    const orderItems = dto.items.map((i) => {
      const v = byId.get(i.variantId)!;
      if (v.currency !== currency)
        throw new BadRequestException('mixed currencies not allowed');
      amount += v.price * i.quantity;
      return {
        productId: v.productId,
        variantId: v.id,
        title: (v as any).productTitle ?? '', // optional pull if you add select
        variantTitle: v.title,
        unitPrice: v.price,
        currency: v.currency,
        quantity: i.quantity,
      };
    });

    // create order
    const creatorType: CreatorType = CreatorType.USER;
    const order = await this.prisma.order.create({
      data: {
        creatorType,
        createdByUserId: req.user.userId,
        createdByMerchantId: null,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
        customerEmail: dto.customerEmail ?? null,
        currency,
        amount,
        status: OrderStatus.PENDING_PAYMENT,
        paymentIntents: { create: [] },
        deliveries: { create: [] },
      },
    });

    // add items
    await this.prisma.ordrItem.createMany({
      data: orderItems.map((oi) => ({ ...oi, orderId: order.id })),
    });

    return {
      orderId: order.id,
      amount,
      currency,
      itemCount: orderItems.length,
    };
  }
}
