import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { OffersController } from './offers.controller';
import { OfferExpirerService } from './offer-expirer.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, RealtimeModule],
  providers: [DispatchService, OfferExpirerService],
  controllers: [DispatchController, OffersController],
  exports: [DispatchService],
})
export class DispatchModule {}
