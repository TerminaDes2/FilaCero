import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Versión sencilla: sólo schema + migrations.seed.
// El datasource se mantiene en schema.prisma (block datasource). No se declara aquí.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});
