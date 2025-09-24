import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { WalletModule } from '../wallet/wallet.module';
import { AdminReleaseController } from './admin-release.controller';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [AdminReleaseController],
})
export class AdminModule {}
