import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { RealtimeModule } from '../realtime/realtime.module';
@Module({
  imports: [PrismaModule, RealtimeModule],
  providers: [DriverService],
  controllers: [DriverController],
})
export class DriverModule {}
