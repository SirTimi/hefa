import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  async ready() {
    // Simple Prisma ping (throw if fails)
    await this.prisma.$queryRawUnsafe('SELECT 1');
    return this.health.check([]);
  }
}
