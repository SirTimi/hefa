import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverKycService } from './driver-kyc.service';
import { DriverKycController } from './driver-kyc.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [DriverKycService],
  controllers: [DriverKycController],
  exports: [DriverKycService],
})
export class DriverKycModule {}
