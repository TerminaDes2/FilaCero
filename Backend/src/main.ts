import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORS
  // - Por defecto permitimos localhost y el dominio de producción en Vercel.
  // - Se puede sobreescribir/añadir con CORS_ORIGINS (lista separada por comas) en el entorno.
  // - Si necesitas cookies entre dominios, activa CORS_CREDENTIALS=true y ajusta SameSite/secure en cookies.
  const defaultOrigins = [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // Dominio backend histórico (no afecta CORS, pero se deja como referencia)
    'https://filacero.up.railway.app',
    // Producción (Frontend en Vercel)
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
    // Añadimos cabeceras comunes de preflight; incluye Authorization y cabeceras personalizadas típicas
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
  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Nest backend escuchando en puerto ${port}`);

  
}
bootstrap();

