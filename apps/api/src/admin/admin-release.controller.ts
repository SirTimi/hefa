import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Controller('admin/orders')
@UseGuards(JwtAccessGuard)
@Roles(Role.ADMIN)
export class AdminReleaseController {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
  ) {}

  @Post(':id/release')
  async release(@Param('id') id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new BadRequestException('order not found');
    if (!order.createdByMerchantId)
      throw new BadRequestException('not a merchant order');
    if (order.status !== 'PAID_HELD')
      throw new BadRequestException('order not held');

    const res = await this.wallet.releaseEscrowToMerchant(
      order.id,
      order.createdByMerchantId,
      order.amount,
      order.currency,
    );
    return { ok: true, idempotent: !!(res as any).idempotent };
  }
}
