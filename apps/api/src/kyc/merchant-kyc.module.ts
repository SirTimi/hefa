import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MerchantKycService } from './merchant-kyc.service';
import { MerchantKycController } from './merchant-kyc.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [MerchantKycService],
  controllers: [MerchantKycController],
  exports: [MerchantKycService],
})
export class MerchantKycModule {}
