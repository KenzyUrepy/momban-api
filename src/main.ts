import * as fs from 'fs';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaClient } from '@prisma/client';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const prisma = new PrismaClient();
  const httpsOptions = {
    cert: fs.readFileSync('./secrets/fullchain.pem'),
    key: fs.readFileSync('./secrets/privkey.pem'),
  };
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  const clientDomains = (await prisma.client.findMany({ select: { domain: true } })).map(
    (origin) => {
      return origin.domain;
    },
  );

  const origins = (await prisma.origin.findMany({ select: { uri: true } })).map((origin) => {
    return origin.uri;
  });

  const allowOrigins = [...clientDomains, ...origins];

  app.use(cookieParser());

  app.enableCors({
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Set-Cookie',
      'client_id',
      'Cookie',
    ],
    credentials: true,
    methods: ['POST', 'GET', 'OPTIONS', 'DELETE'],
    origin: function (origin, callback) {
      if (!origin || allowOrigins.indexOf(origin) !== -1) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'), null);
      }
    },
  });

  await app.listen(3000);
}
bootstrap();
