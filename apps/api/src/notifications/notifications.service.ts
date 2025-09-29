import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider } from './providers/sms.provider';
import { EmailProvider } from './providers/email.provider';
import { PrismaService } from '../prisma/prisma.service';
import { render } from './templates';

export type NotificationKind =
  | 'order_paid'
  | 'delivery_assigned'
  | 'delivery_delivered'
  | 'payout_sent';

export interface NotificationJob {
  kind: NotificationKind;
  to: {
    userId?: string | null;
    phone?: string | null;
    email?: string | null;
    name?: string | null;
  };
  data: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);
  private readonly smsEnabled = (process.env.SMS_PROVIDER ?? 'none') !== 'none';
  private readonly emailEnabled = !!process.env.SMTP_HOST;

  constructor(
    private sms: SmsProvider,
    private email: EmailProvider,
    private prisma: PrismaService,
  ) {}

  async send(job: NotificationJob) {
    const { subject, text, html } = render(job);

    // load prefs if userId provided
    const prefs = await this.loadPrefs(job.to.userId);
    const channels = pickChannels(prefs, job.kind);

    // SMS
    if (channels.sms && this.smsEnabled && job.to.phone) {
      try {
        await this.sms.send(job.to.phone, text);
      } catch (e: any) {
        this.log.warn(`SMS failed: ${e?.message || e}`);
      }
    } else if (channels.sms && job.to.phone) {
      this.log.debug(`[DEV SMS] -> ${job.to.phone}: ${text}`);
    }

    // Email
    if (channels.email && this.emailEnabled && job.to.email) {
      try {
        await this.email.send(job.to.email, subject, text, html);
      } catch (e: any) {
        this.log.warn(`Email failed: ${e?.message || e}`);
      }
    } else if (channels.email && job.to.email) {
      this.log.debug(`[DEV EMAIL] -> ${job.to.email}: ${subject}\n${text}`);
    }

    return { ok: true };
  }

  private async loadPrefs(userId?: string | null) {
    if (!userId) return defaultPrefs();
    const p = await this.prisma.notificationPrefs.findUnique({
      where: { userId },
    });
    return p ?? defaultPrefs();
  }
}

function defaultPrefs() {
  return {
    emailEnabled: true,
    smsEnabled: true,
    orderPaidEmail: true,
    orderPaidSms: true,
    deliveryAssignedEmail: true,
    deliveryAssignedSms: true,
    deliveryDeliveredEmail: true,
    deliveryDeliveredSms: true,
    payoutSentEmail: true,
    payoutSentSms: true,
  };
}

function pickChannels(
  prefs: ReturnType<typeof defaultPrefs>,
  kind: NotificationKind,
) {
  switch (kind) {
    case 'order_paid':
      return {
        email: prefs.emailEnabled && prefs.orderPaidEmail,
        sms: prefs.smsEnabled && prefs.orderPaidSms,
      };
    case 'delivery_assigned':
      return {
        email: prefs.emailEnabled && prefs.deliveryAssignedEmail,
        sms: prefs.smsEnabled && prefs.deliveryAssignedSms,
      };
    case 'delivery_delivered':
      return {
        email: prefs.emailEnabled && prefs.deliveryDeliveredEmail,
        sms: prefs.smsEnabled && prefs.deliveryDeliveredSms,
      };
    case 'payout_sent':
      return {
        email: prefs.emailEnabled && prefs.payoutSentEmail,
        sms: prefs.smsEnabled && prefs.payoutSentSms,
      };
  }
}
