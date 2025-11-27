import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Configuración Prisma 7: datasource URL se define aquí en lugar de schema.prisma
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
});
