import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAccessGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

function toCsvRow(fields: (string | number | null | undefined)[]) {
  return (
    fields
      .map((v) => {
        const s = v === null || v === undefined ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(',') + '\n'
  );
}

@Controller('admin/reco')
@UseGuards(JwtAccessGuard)
@Roles(Role.ADMIN)
export class AdminRecoController {
  constructor(private prisma: PrismaService) {}

  @Get('journal-csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="journal.csv"')
  async journalCsv(@Query('date') date: string) {
    // Expect YYYY-MM-DD
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return (
        toCsvRow(['error', 'Invalid date, use YYYY-MM-DD']) +
        toCsvRow(['example', `${yyyy}-${mm}-${dd}`])
      );
    }
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    const entries = await this.prisma.journalEntry.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: [{ createdAt: 'asc' }, { lineNo: 'asc' }],
      include: {
        account: true,
      },
      take: 10_000,
    });

    let out = '';
    out += toCsvRow([
      'txnId',
      'lineNo',
      'createdAt',
      'side',
      'amount',
      'currency',
      'accountId',
      'ownerType',
      'ownerId',
      'purpose',
      'type',
    ]);
    for (const e of entries) {
      out += toCsvRow([
        e.txnId,
        e.lineNo,
        e.createdAt.toISOString(),
        e.side,
        e.amount,
        e.currency,
        e.accountId,
        e.account.ownerType,
        e.account.ownerId,
        e.account.purpose,
        e.account.type,
      ]);
    }
    return out;
  }
}
