import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.modules';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';

@Module({
  imports: [PrismaModule],
  providers: [DriverService],
  controllers: [DriverController],
})
export class DriverModule {}
