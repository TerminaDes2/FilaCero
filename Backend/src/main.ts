import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { json, urlencoded } from 'express';
import { envs } from './config';

// --- 1. IMPORTAR NestExpressApplication ---
import { NestExpressApplication } from '@nestjs/platform-express';

// --- 2. IMPORTAR 'join' DE 'path' ---
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  // Recordar quitar esto en caso de no ser necesario
  // --- IGNORE ---
  const bodyLimit = process.env.REQUEST_BODY_LIMIT || '10mb';
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ limit: bodyLimit, extended: true }));
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
    origin: allowedOrigins,
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

  const port = envs.port || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Nest backend escuchando en puerto ${port}`);
}
bootstrap();