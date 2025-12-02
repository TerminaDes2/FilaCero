// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Fallback getters for models when the generated Prisma Client types are out of date
  // This ensures TypeScript doesn't block compilation in environments where the client
  // hasn't been regenerated yet (e.g., outside Docker). At runtime, PrismaClient exposes
  // these model delegates if they exist in schema.prisma.
  get empleados(): any {
    return (this as any).empleados;
  }

  get negocio_producto(): any {
    return (this as any).negocio_producto;
  }
}
