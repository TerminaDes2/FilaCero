import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // servir uploads sin @nestjs/serve-static


  // --- 3. AUMENTAR LÍMITES DE HEADERS PARA EVITAR 431 ---
  const maxHeaderSize = parseInt(process.env.MAX_HTTP_HEADER_SIZE || '32768', 10);
  const expressInstance = express();
  // Configurar 'trust proxy' para que express-rate-limit pueda usar X-Forwarded-For
  // Valor configurable vía env `TRUST_PROXY`. Si no existe, por defecto habilitado (true).
  // Soporta: 'true' | 'false' | número (ej. '1') | string de subred. Se convierte a tipo adecuado.
  const _trust = process.env.TRUST_PROXY;
  const trustProxyValue = (() => {
    if (_trust === undefined) return true; // habilitar por defecto en entornos con proxy
    if (_trust === 'true') return true;
    if (_trust === 'false') return false;
    const n = Number(_trust);
    if (!Number.isNaN(n)) return n;
    return _trust; // cadena (ej. '127.0.0.1' o 'loopback')
  })();
  expressInstance.set('trust proxy', trustProxyValue as any);
  const adapter = new ExpressAdapter(expressInstance);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, adapter, {
    bodyParser: false, // Lo configuraremos manualmente con límites más grandes
  
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
  prefix: '/uploads/',
  });
  app.enableCors();
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());
  await app.listen(process.env.PORT || 3000);
}
bootstrap();