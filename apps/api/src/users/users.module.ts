import { Module } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaModule } from '../prisma/prisma.modules';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
