import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailProvider } from '../notifications/providers/email.provider';

@Controller('support')
export class SupportController {
  constructor(
    private prisma: PrismaService,
    private email: EmailProvider,
  ) {}

  @Post('message')
  async create(
    @Body()
    body: {
      email?: string;
      phone?: string;
      subject: string;
      message: string;
    },
  ) {
    const saved = await this.prisma.supportMessage.create({ data: body });
    const forwardTo = process.env.SUPPORT_EMAIL;
    if (forwardTo) {
      const txt = `From: ${body.email ?? body.phone ?? 'unknown'}\nSubject: ${body.subject}\n\n${body.message}`;
      await this.email.send(
        forwardTo,
        `Support: ${body.subject}`,
        txt,
        `<pre>${txt}</pre>`,
      );
    }
    return { ok: true, id: saved.id };
  }

  // minimal admin-ish endpoints (add guards)
  @Get('messages')
  async list(@Query('status') status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') {
    return this.prisma.supportMessage.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  @Put('messages/:id/status')
  async setStatus(
    @Param('id') id: string,
    @Body() body: { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' },
  ) {
    await this.prisma.supportMessage.update({
      where: { id },
      data: { status: body.status },
    });
    return { ok: true };
  }
}
