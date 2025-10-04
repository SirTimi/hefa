import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { json, raw } from 'body-parser';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  //Important: Raw body for paystack webhook must be Before global json()
  app.use('/payments/paystack/webhook', raw({ type: '*/*' }));

  // Normal JSON verywhere else
  app.use(json());

  //Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // This makes Nest call OnModuleDestroy() on SIGINT/SIGTERM
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('HEFA API')
    .setDescription('Backend endpoints for ADMIN/DRIVER/MERCHANT/USER')
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .build();

  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  });

  const outPath = join(__dirname, '..', 'openapi.json');
  writeFileSync(outPath, JSON.stringify(doc, null, 2));
  console.log('OpenAPI written:', outPath);

  await app.listen(3000);
}
bootstrap();
