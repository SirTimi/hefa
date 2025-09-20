// apps/api/src/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersController } from './orders.controller';
import { PublicOrdersController } from './public.controller';
import { OrdersService } from './orders.service';
import { PolicyModule } from '../policy/policy.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../auth/roles.guard';
import { AdminOrdersController } from './admin.controller';

@Module({
  imports: [PrismaModule, WalletModule, PaymentsModule, PolicyModule],
  providers: [
    OrdersService,
    // THIS IS OPTIONAL, IM MAKING ROLES GUARD AVAILABLE APP WIDE FOR THE MODULE ROUTES
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [
    OrdersController,
    PublicOrdersController,
    AdminOrdersController,
  ],
})
export class OrdersModule {}
