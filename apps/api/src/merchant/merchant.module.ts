import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';

@Module({
  imports: [PrismaModule],
  providers: [MerchantService],
  controllers: [MerchantController],
  exports: [MerchantService],
})
export class MerchantModule {}
