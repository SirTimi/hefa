import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SmsProvider } from './providers/sms.provider';
import { TermiiProvider } from './providers/termii.provider';
import { EmailProvider } from './providers/email.provider';
import { NotifyQueueService } from './queue/notify.queue';
import { NotifyWorkerModule } from './queue/notify.worker.module';
import { NotificationPrefsController } from './prefs.controller';

@Module({
  imports: [NotifyWorkerModule], // worker lives in same process (split later if needed)
  providers: [
    NotificationsService,
    SmsProvider,
    TermiiProvider,
    EmailProvider,
    NotifyQueueService,
  ],
  controllers: [NotificationPrefsController],
  exports: [NotificationsService, NotifyQueueService],
})
export class NotificationsModule {}
