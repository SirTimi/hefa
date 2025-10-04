import {
  Controller,
  Get,
  Query,
  Req,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

type Cursor = string | undefined;

@ApiTags('admin/audit')
@ApiBearerAuth()
@Controller('admin/audit')
export class AuditReadController {
  constructor(private prisma: PrismaService) {}

  /** Admin-only guard without extra dependencies */
  private assertAdmin(req: any) {
    const role = req?.user?.role;
    if (role !== 'ADMIN') throw new ForbiddenException('admin only');
  }

  @Get()
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'take', required: false, schema: { default: 50 } })
  @ApiQuery({ name: 'cursor', required: false, description: 'cursor id' })
  async list(
    @Req() req: any,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('take', ParseIntPipe) takeRaw = 50,
    @Query('cursor') cursor?: Cursor,
  ) {
    this.assertAdmin(req);

    const take = Math.min(Math.max(takeRaw ?? 50, 1), 200);

    const where: any = {};
    if (action) where.action = action;
    if (actorId) where.actorId = actorId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const rows = await this.prisma.audtLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take,
      select: {
        id: true,
        createdAt: true,
        actorId: true,
        action: true,
        entity: true,
        details: true,
      },
    });

    const nextCursor = rows.length === take ? rows[rows.length - 1].id : null;
    return { items: rows, nextCursor };
  }

  /** Optional CSV export for quick ops */
  @Get('export.csv')
  async exportCsv(
    @Req() req: any,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.assertAdmin(req);

    const where: any = {};
    if (action) where.action = action;
    if (actorId) where.actorId = actorId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const rows = await this.prisma.audtLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        actorId: true,
        action: true,
        entity: true,
        details: true,
      },
      take: 5000, // cap exports
    });

    const header = 'createdAt,actorId,action,entity,details';
    const csv = [
      header,
      ...rows.map((r) =>
        [
          r.createdAt.toISOString(),
          r.actorId ?? '',
          r.action ?? '',
          (r.entity ?? '').replace(/,/g, ' '),
          // stringify details safely, strip commas/newlines
          (() => {
            try {
              const s = JSON.stringify(r.details ?? {});
              return s.replace(/[\r\n,]/g, ' ');
            } catch {
              return '';
            }
          })(),
        ].join(','),
      ),
    ].join('\n');

    // Return as plain text so FE can prompt download easily
    return csv;
  }
}
