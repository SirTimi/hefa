import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { DriverKycService } from './driver-kyc.service';
import { DriverKycController } from './driver-kyc.controller';

@Module({
  imports: [PrismaModule],
  providers: [DriverKycService],
  controllers: [DriverKycController],
  exports: [DriverKycService],
})
export class DriverKycModule {}
