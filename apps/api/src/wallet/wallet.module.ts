import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletService } from './wallet.service';
import { WalletReadController } from './wallet.read.controller';

@Module({
  imports: [PrismaModule],
  providers: [WalletService],
  controllers: [WalletReadController],
  exports: [WalletService],
})
export class WalletModule {}
