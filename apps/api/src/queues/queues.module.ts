import { DynamicModule, Module } from '@nestjs/common';
import { Queue } from 'bullmq';

export const QUEUE_NOTIFICATIONS = 'QUEUE_NOTIFICATIONS';

@Module({})
export class QueuesModule {
  static register(): DynamicModule {
    const url = process.env.REDIS_URL;
    if (!url) {
      //No  Redis: register NOOP provider so imports wont  crash
      return {
        module: QueuesModule,
        providers: [
          { provide: QUEUE_NOTIFICATIONS, useValue: { add: async () => null } },
        ],
        exports: [QUEUE_NOTIFICATIONS],
      };
    }
    const connection = { url };
    return {
      module: QueuesModule,
      providers: [
        {
          provide: QUEUE_NOTIFICATIONS,
          useFactory: () => new Queue('notifications', { connection }),
        },
      ],
      exports: [QUEUE_NOTIFICATIONS],
    };
  }
}
