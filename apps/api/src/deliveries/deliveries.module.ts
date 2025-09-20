import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { PublicDeliveryController } from './public.controller';

@Module({
  imports: [PrismaModule],
  providers: [DeliveriesService],
  controllers: [DeliveriesController, PublicDeliveryController],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
