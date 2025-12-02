import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Configuración Prisma 7: datasource URL se define aquí en lugar de schema.prisma
// Cast to any to avoid strict typing mismatches with the local Prisma config helper
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
} as any);
