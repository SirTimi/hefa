import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MerchantKycService } from './merchant-kyc.service';
import { MerchantKycController } from './merchant-kyc.controller';

@Module({
  imports: [PrismaModule],
  providers: [MerchantKycService],
  controllers: [MerchantKycController],
  exports: [MerchantKycService],
})
export class MerchantKycModule {}
