import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletService } from './wallet.service';
import { WalletReadController } from './wallet.read.controller';
import { JournalReadController } from './journal.read.controller';

@Module({
  imports: [PrismaModule],
  providers: [WalletService],
  controllers: [WalletReadController, JournalReadController],
  exports: [WalletService],
})
export class WalletModule {}
