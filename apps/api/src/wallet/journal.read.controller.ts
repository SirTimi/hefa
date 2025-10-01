import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Wallet')
@ApiBearerAuth('bearer')
@Controller('wallet')
@UseGuards(JwtAccessGuard)
export class JournalReadController {
  constructor(private prisma: PrismaService) {}

  @Get('journal')
  @Roles(Role.ADMIN)
  async journal(
    @Query('accountId') accountId: string,
    @Query('take') takeRaw?: string,
  ) {
    const take = Math.min(
      Math.max(parseInt(takeRaw ?? '50', 10) || 50, 1),
      200,
    );
    const lines = await this.prisma.journalEntry.findMany({
      where: { accountId },
      orderBy: [{ createdAt: 'desc' }, { lineNo: 'desc' }],
      take,
    });
    return lines;
  }
}
