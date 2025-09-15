import { Controller, Get } from '@nestjs/common';

@Controller('healthz')
export class HealthController {
  @Get()
  ping() {
    return { ok: true, ts: Date.now() };
  }
}
