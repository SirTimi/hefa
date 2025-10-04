import { Module } from '@nestjs/common';
import * as client from 'prom-client';
import { MetricsController } from './metrics.controller';

client.collectDefaultMetrics(); // once at module load

@Module({ controllers: [MetricsController] })
export class MetricsModule {}
