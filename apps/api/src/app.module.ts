import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { WalletModule } from './wallet/wallet.module';
import { PaymentsModule } from './payments/payments.module';
import { MerchantModule } from './merchant/merchant.module';
import { DriverModule } from './driver/driver.module';
import { DispatchModule } from './dispatch/dispatch.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DriverKycModule } from './kyc/driver-kyc.module';
import { MerchantKycModule } from './kyc/merchant-kyc.module';
import { KycModule } from './kyc/kyc.module';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersFromVariantsController } from './orders/from-variants.controller';
import { LedgerModule } from './ledger/ledger.module';
import { AdminModule } from './admin/admin.module';
import { PayoutsModule } from './payouts/payouts.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    WalletModule,
    PaymentsModule,
    OrdersModule,
    MerchantModule,
    DriverModule,
    DispatchModule,
    DeliveriesModule,
    ScheduleModule.forRoot(),
    RealtimeModule,
    DriverKycModule,
    MerchantKycModule,
    KycModule,
    CatalogModule,
    LedgerModule,
    AdminModule,
    PayoutsModule,
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.RATE_LIMIT_TTL ?? '60'),
        limit: Number(process.env.RATE_LIMIT_MAX ?? '120'),
      },
    ]),
    TerminusModule,
    HealthModule,
  ],
  controllers: [AppController, HealthController, OrdersFromVariantsController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
