import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { json, urlencoded } from 'express';

// --- 1. IMPORTAR NestExpressApplication ---
import { NestExpressApplication } from '@nestjs/platform-express';

// --- 2. IMPORTAR 'join' DE 'path' ---
import { join } from 'path';

async function bootstrap() {
  // --- 3. ESPECIFICAR EL TIPO de 'app' ---
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
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

  // --- 4. AÑADIR SERVIDOR DE ARCHIVOS ESTÁTICOS ---
  // Esto hace que la carpeta './uploads' (relativa a 'dist') sea accesible.
  // 'join(__dirname, '..', 'uploads')' resuelve la ruta a /app/uploads dentro del contenedor
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // La URL será http://localhost:3000/uploads/archivo.jpg
  });
  // --- FIN DE LA MODIFICACIÓN ---

  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Nest backend escuchando en puerto ${port}`);
}
bootstrap();