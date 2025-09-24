import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { LedgerReadService } from './ledger-read.service';
import { AdminLedgerController } from './admin-ledger.controller';

@Module({
  imports: [PrismaModule],
  providers: [LedgerReadService],
  controllers: [AdminLedgerController],
})
export class LedgerModule {}
