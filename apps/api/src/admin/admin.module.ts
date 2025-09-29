import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdminReleaseController } from './admin-release.controller';
import { AdminRecoController } from './reco.controller';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [AdminReleaseController, AdminRecoController],
})
export class AdminModule {}
