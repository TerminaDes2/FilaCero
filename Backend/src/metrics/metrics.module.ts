// Backend/src/metrics/metrics.module.ts

import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
// No olvides importar el PrismaModule si no es global
// import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [/* PrismaModule */], // Asegúrate de que PrismaService esté disponible
  controllers: [MetricsController],
  providers: [MetricsService],
})
export class MetricsModule {}