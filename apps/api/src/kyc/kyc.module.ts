import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverKycModule } from './driver-kyc.module';
import { MerchantKycModule } from './merchant-kyc.module';
import { AdminKycController } from './admin-kyc.controller';
import { DriverKycService } from './driver-kyc.service';
import { MerchantKycService } from './merchant-kyc.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminKycController],
  providers: [DriverKycService, MerchantKycService],
  exports: [DriverKycService, MerchantKycService],
})
export class KycModule {}
