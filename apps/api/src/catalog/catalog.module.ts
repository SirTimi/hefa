import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogService } from './catalog.service';
import { CatalogMerchantController } from './merchant.controller';
import { CatalogPublicController } from './public.controller';

@Module({
  imports: [PrismaModule],
  providers: [CatalogService],
  controllers: [CatalogMerchantController, CatalogPublicController],
  exports: [CatalogService],
})
export class CatalogModule {}
