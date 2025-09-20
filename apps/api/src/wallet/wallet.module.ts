import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { WalletService } from './wallet.service';

@Module({
  imports: [PrismaModule],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
