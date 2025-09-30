import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdminReleaseController } from './admin-release.controller';
import { AdminRecoController } from './reco.controller';
import { AuditReadController } from './audit.read.controller';
@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [
    AdminReleaseController,
    AdminRecoController,
    AuditReadController,
  ],
})
export class AdminModule {}
