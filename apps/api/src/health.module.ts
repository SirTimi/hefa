// apps/api/src/health/health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [PrismaModule, TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
