import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { json, raw } from 'body-parser';
import helmet from 'helmet';
import { Logger } from '@nestjs/common';
import { Logger as PinoLogger } from 'pino';
import * as Sentry from '@sentry/node';
import * as SentryProfiler from '@sentry/profiling-node';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV ?? 'dev',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0'),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0'),
    integrations: [SentryProfiler.nodeProfilingIntegration()],
  });

  const app = await NestFactory.create(AppModule);
  app.useLogger(new Logger());

  app.use(helmet());

  app.enableCors({ origin: true, credentials: true });

  app.use(cookieParser());

  //Important: Raw body for paystack webhook must be Before global json()
  app.use('/payments/paystack/webhook', raw({ type: '*/*' }));

  // Normal JSON verywhere else
  app.use(json());

  //Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // This makes Nest call OnModuleDestroy() on SIGINT/SIGTERM
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
