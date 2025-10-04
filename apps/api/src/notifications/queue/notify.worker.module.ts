import { Module } from '@nestjs/common';
import { NotifyWorker } from './notify.worker';
import { NotificationsService } from '../notifications.service';
import { SmsProvider } from '../providers/sms.provider';
import { EmailProvider } from '../providers/email.provider';
import { TermiiProvider } from '../providers/termii.provider';

@Module({
  providers: [
    NotifyWorker,
    NotificationsService,
    SmsProvider,
    EmailProvider,
    TermiiProvider,
  ],
})
export class NotifyWorkerModule {}
