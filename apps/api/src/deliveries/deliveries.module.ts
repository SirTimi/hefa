import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { PublicDeliveryController } from './public.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, RealtimeModule, WalletModule, NotificationsModule],
  providers: [DeliveriesService],
  controllers: [DeliveriesController, PublicDeliveryController],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
