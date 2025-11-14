import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import express, { json, urlencoded } from 'express';
import { envs } from './config';

// --- 1. IMPORTAR NestExpressApplication ---
import { NestExpressApplication, ExpressAdapter } from '@nestjs/platform-express';

// --- 2. IMPORTAR 'join' DE 'path' ---
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { createServer } from 'http';

async function bootstrap() {
  // --- 3. AUMENTAR LÍMITES DE HEADERS PARA EVITAR 431 ---
  const maxHeaderSize = parseInt(process.env.MAX_HTTP_HEADER_SIZE || '32768', 10);
  const expressInstance = express();
  const adapter = new ExpressAdapter(expressInstance);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, adapter, {
    bodyParser: false, // Lo configuraremos manualmente con límites más grandes
  });

  // Configurar límites de headers y body más generosos
  const bodyLimit = process.env.REQUEST_BODY_LIMIT || '50mb';
  
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ limit: bodyLimit, extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  // CORS
  // ... (toda tu configuración de CORS se mantiene igual)
  const defaultOrigins = [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://filacero.up.railway.app',
    'https://fila-cero.vercel.app',
  ];
  const envOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
  const allowCredentials = (process.env.CORS_CREDENTIALS || 'false') === 'true';

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        return callback(null, true);
      }

      const localhostPattern = /^http:\/\/localhost:\d+$/i;
      const loopbackPattern = /^http:\/\/127\.0\.0\.1:\d+$/;

      if (
        allowedOrigins.includes(requestOrigin) ||
        localhostPattern.test(requestOrigin) ||
        loopbackPattern.test(requestOrigin)
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Business-Id',
      'X-Store-Id',
    ],
    credentials: allowCredentials,
    optionsSuccessStatus: 204,
    maxAge: 600,
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  
  app.useGlobalInterceptors(new BigIntInterceptor());

  // Static serving for uploaded files and ensure uploads directory exists
  const uploadsDir = join(process.cwd(), 'uploads');
  try {
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  } catch {}
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  await app.init();

  const port = envs.port || 3000;
  const httpServer = createServer({ maxHeaderSize }, expressInstance);
  httpServer.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Nest backend escuchando en puerto ${port}`);
  });
}
bootstrap();