import { Body, Controller, Post, Req, Headers } from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaystackProvider } from './paystack.provider';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentProvider } from '@prisma/client';
import { PayoutsService } from '../payouts/payouts.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private svc: PaymentsService,
    private paystack: PaystackProvider,
    private prisma: PrismaService,
    private payouts: PayoutsService,
  ) {}

  @UseGuards(JwtAccessGuard)
  @Post('paystack/intent')
  createIntent(@Req() req: any, @Body() body: { orderId: string }) {
    return this.svc.createPaystackIntent(body.orderId, req.user.userId);
  }

  @Post('paystack/webhook')
  async webhook(
    @Body() body: any,
    @Headers('x-paystack-signature') sig: string | undefined,
    @Req() req: any,
  ) {
    // Express's raw() will set req.body to Buffer; if not, fallback to stringify
    const rawBuf: Buffer = Buffer.isBuffer(req.body)
      ? (req.body as Buffer)
      : Buffer.from(JSON.stringify(body));
    const parsed = await this.paystack.parseWebhook(rawBuf, sig);

    if (!parsed.ok) {
      // store failed signature too for audit
      await this.prisma.webhookEvent.create({
        data: {
          provider: PaymentProvider.PAYSTACK,
          providerEventId: `bad_${Date.now()}`,
          payload: body,
          processedAt: new Date(),
          success: false,
        },
      });
      return { ok: false };
    }

    // Upsert by (provider, eventId)
    const wh = await this.prisma.webhookEvent.upsert({
      where: {
        provider_providerEventId: {
          provider: PaymentProvider.PAYSTACK,
          providerEventId: parsed.eventId!,
        },
      },
      update: {}, // already seen → no reprocessing
      create: {
        provider: PaymentProvider.PAYSTACK,
        providerEventId: parsed.eventId!,
        payload: parsed.raw ?? body,
        processedAt: null,
        success: null,
      },
    });

    // If already processed, exit (idempotent)
    if (wh.processedAt) return { ok: true, idempotent: true };

    let success = true;
    try {
      // Success charge
      if (parsed.event === 'charge.success' && parsed.reference) {
        await this.svc.markSucceededByRef(parsed.reference);
      } else if (/refund/i.test(parsed.event) && parsed.reference) {
        await this.svc.markRefundedByRef(parsed.reference);
      } else if (parsed.event?.startsWith('transfer.') && parsed.reference) {
        await this.payouts.processTransferWebhook(
          parsed.reference,
          parsed.event,
          parsed.raw,
        );
      }
    } catch (e) {
      success = false;
    }

    // mark processed
    await this.prisma.webhookEvent.update({
      where: { id: wh.id },
      data: { processedAt: new Date(), success },
    });

    return { ok: success };
  }
}
