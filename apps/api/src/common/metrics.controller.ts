import { Controller, Get } from '@nestjs/common';
import * as client from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  async metrics(): Promise<string> {
    return await client.register.metrics();
  }
}
