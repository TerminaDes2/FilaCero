import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import express, { json, urlencoded } from 'express';
import { envs } from './config';
import rateLimit from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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
    'https://filacero.store',
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

  // ===== RATE LIMITING =====
  // Rate limiter general para /api/payments (excepto webhook)
  const paymentsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    message: {
      statusCode: 429,
      message: 'Demasiadas solicitudes a endpoints de pagos. Intenta nuevamente en 15 minutos.',
      error: 'Too Many Requests',
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
  });

  // Rate limiter estricto para webhook (protección anti-spam)
  const webhookLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // 50 webhooks por ventana (Stripe puede enviar reintentos)
    message: {
      statusCode: 429,
      message: 'Demasiados webhooks recibidos. Verifica configuración de Stripe.',
      error: 'Too Many Requests',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Aplicar rate limiters específicos
  app.use('/api/payments/create-intent', paymentsLimiter);
  app.use('/api/payments/confirm', paymentsLimiter);
  app.use('/api/payments/methods', paymentsLimiter);
  app.use('/api/payments/webhook', webhookLimiter);

  // Configuración de Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('FilaCero API')
    .setDescription(
      'API REST para sistema de pagos y gestión de pedidos de FilaCero',
    )
    .setVersion('0.3.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresar JWT token (obtenido de /api/auth/login)',
        in: 'header',
      },
      'JWT-auth', // Este es el nombre de referencia para @ApiBearerAuth()
    )
    .addTag('payments', 'Endpoints de procesamiento de pagos con Stripe')
    .addTag('auth', 'Autenticación y gestión de sesiones')
    .addTag('pedidos', 'Gestión de pedidos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'FilaCero API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      tagsSorter: 'alpha',
    },
  });

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