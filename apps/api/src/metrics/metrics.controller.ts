import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { register } from 'prom-client';

@ApiExcludeController()
@Controller()
export class MetricsController {
  @Get('/metrics')
  @Header('Content-Type', register.contentType)
  async metrics() {
    return register.metrics();
  }
}
