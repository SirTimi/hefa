import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EmailProvider } from '../notifications/providers/email.provider';

@Module({
  controllers: [SupportController],
  providers: [PrismaService, EmailProvider],
})
export class SupportModule {}
