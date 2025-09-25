# Copilot Instructions for FilaCero

These guidelines help AI coding agents work effectively in this repository. Focus on the concrete patterns that already exist.

## 1. Arquitectura General
- Monorepo sencillo: `Backend/` (NestJS + Prisma + TypeORM coexistiendo) y `Frontend/` (Next.js 13 App Router + Tailwind + Zustand).
- Orquestación: `docker-compose.yml` levanta `backend`, `frontend`, `postgres` en red `filacero-net`.
- Backend actualmente mezcla dos aproximaciones a datos:
  - TypeORM (entidad `Product` en `src/products/product.schema.ts`).
  - Prisma (módulo `PrismaModule` y `schema.prisma` para modelos `roles`, `usuarios`, `product`). Migración en transición.
- Objetivo implícito: migrar gradualmente módulos a Prisma (ver inclusión de `PrismaModule` en `app.module.ts`).

## 2. Backend (NestJS)
- Módulos clave en `src/`: `auth`, `users`, `roles`, `prisma`, `products`.
- Controladores usan prefijo explícito (ej: `@Controller('api/products')`). Mantener el patrón `/api/<recurso>`.
- Servicios siguen patrón CRUD básico retornando entidades directamente (sin DTO de respuesta todavía).
- Validación DTO: se utiliza `class-validator` y `class-transformer` (añadir decoradores en nuevos DTOs).
- No hay aún guardas de auth aplicadas en `ProductController`; agregar auth debe hacerse con guards (`@UseGuards(AuthGuard('jwt'))`) y decoradores de roles en el futuro.
- Errores: usar excepciones Nest (`NotFoundException`, etc.). No atrapar salvo que se traduzca a un código específico.

## 3. Persistencia de Datos
- Prisma: archivo `Backend/prisma/schema.prisma`. Después del cambio reciente se usan defaults `uuid()` en lugar de `uuid_generate_v4()` para evitar dependencia de la extensión `uuid-ossp`.
- Aún no existen migraciones generadas (`prisma/migrations/` vacío). Al crear la primera usar `npx prisma migrate dev --name init` dentro del contenedor backend.
- TypeORM: Entidad `Product` usa `@PrimaryGeneratedColumn('uuid')`. `synchronize` está (implícitamente) activo en configuración (ver Docs/Backend.md). Si se consolida a Prisma, eliminar entidad TypeORM duplicada para evitar divergencia.
- Evitar mezclar en un mismo módulo repositorio TypeORM y Prisma Client. Escoger uno por recurso.

## 4. Frontend (Next.js App Router)
- Ruta raíz en `Frontend/app/page.tsx` (landing). Subcarpetas para flujos: `auth/`, `onboarding/`, `pos/`.
- Estado global ligero con Zustand (`src/state/userStore.tsx`). Reutilizar este patrón para nuevos stores.
- Estilos: Tailwind configurado; componentes UI en `src/components/`. Sostener Atomic-ish: piezas pequeñas reutilizables + features en `src/features/`.
- Llamadas a API: aún no existe helper central; preferido crear wrapper en `src/lib/` (ver sugerencia en `Docs/Frontend.md`). Mantener uso de `NEXT_PUBLIC_API_BASE`.
- Componentes Server vs Client: añadir `'use client'` en archivos con estado, hooks, o Zustand.

## 5. Docker / Entorno
- Variables críticas: `DATABASE_URL` inyectada al backend desde `docker-compose.yml` (`postgres://user:password@postgres:5432/filacero`).
- Script SQL inicial en `Docker/db/db_filacero.sql`; se ejecuta al inicializar el volumen (no contiene extensiones). Si se adoptan migraciones Prisma, este script puede quedar obsoleto o convertirse en semilla manual.
- Para reiniciar limpio (destructivo): `docker compose down -v && docker compose up -d`.

## 6. Workflows Recomendados
- Generar Cliente Prisma tras editar `schema.prisma`: `docker exec -it filacero-backend npx prisma generate`.
- Crear migración inicial: `docker exec -it filacero-backend npx prisma migrate dev --name init`.
- Añadir módulo Nest: usar CLI dentro del contenedor para consistencia: `docker exec -it filacero-backend npx nest g module <name>`.
- Debug Node: puerto 9229 ya expuesto (usar `start:debug` si se activa watch + inspector).

## 7. Convenciones de Código
- Nombres de carpetas en minúsculas pluralizadas (`products`, `users`, `roles`). Mantener consistencia.
- DTOs en subcarpeta `dto/` con sufijos `*.dto.ts`.
- Evitar añadir lógica en controladores; delegar a servicios.
- Respuestas crudas de entidades; formateo adicional (transformers / interceptors) aún no implementado.
- Identificadores UUID para entidades modernas; bigint autoincrement para roles/usuarios en Prisma (coexistencia temporal).

## 8. Decisiones Importantes / Riesgos
- Doble ORM (TypeORM + Prisma) es riesgo de divergencia. Al añadir nuevas entidades, preferir Prisma (dirección actual) y plan para migrar Product.
- Falta de migraciones formales: priorizar creación de la primera migración Prisma antes de cambios de esquema.
- Autenticación incompleta; endpoints sensibles deben esperar guardas antes de exponerlos públicamente.

## 9. Añadiendo Nuevas Funcionalidades
Ejemplo (añadir "categories") con Prisma:
1. Editar `schema.prisma` agregando modelo y `npx prisma migrate dev --name add_categories`.
2. Generar cliente y crear `categories` module (controlador/servicio) usando `PrismaService`.
3. Inyectar `PrismaService` y usar `this.prisma.category` (naming: modelo -> lowerCamelCase client accessor).
4. Exponer rutas en `/api/categories` siguiendo patrón CRUD de `ProductController`.

## 10. Pull Requests / Cambios
- Mantener cambios de esquema en migraciones Prisma (no SQL manual salvo seeds).
- Explicar en la PR: motivo del cambio, impacto en datos, pasos para aplicar localmente.
- No introducir dependencias globales sin añadirlas a Docker si se requieren en runtime.

## 11. Lo Que NO Debe Hacer el Agente
- No mezclar en un mismo servicio llamadas Prisma y repositorios TypeORM.
- No regenerar cliente Prisma sin avisar si el schema cambió de forma incompatible.
- No añadir comentarios excesivos; seguir estilo existente (limpio y directo).
- No introducir librerías pesadas para tareas simples (p.ej. lodash para algo trivial).

## 12. Próximos Ajustes Sugeridos (si se solicita)
- Migrar `Product` a Prisma y eliminar entidad TypeORM duplicada.
- Implementar módulo Auth completo (JWT guards) antes de exponer endpoints sensibles.
- Añadir tests básicos (e2e para products) y pipeline CI.

---
Feedback: Indica si falta algo sobre auth, migración a Prisma o flujo de CI para refinar este documento.
