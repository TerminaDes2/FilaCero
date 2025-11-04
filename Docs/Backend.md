# Backend

## Resumen
El backend de FilaCero es una API REST sobre **NestJS 10** con autenticación JWT, validación mediante DTOs y acceso a datos con **Prisma Client** contra PostgreSQL. Subsisten algunos módulos en **TypeORM** (ej. `products`) mientras se completa la migración. Todos los controladores se exponen bajo el prefijo `/api`.

## Stack principal
- NestJS (`@nestjs/common`, `@nestjs/passport`, `@nestjs/config`).
- Prisma Client generado desde `prisma/schema.prisma` (PostgreSQL).
- TypeORM sólo para entidades legacy.
- Validación: `class-validator` y `class-transformer`.
- Autenticación: `@nestjs/passport` con estrategia `jwt` y guardas de roles.

## Organización de carpetas
```
Backend/
  src/
    app.module.ts            # Módulo raíz
    auth/                    # Login, registro, verificación, JWT
    users/                   # Perfil y administración de usuarios
    businesses/              # Alta y configuración de negocios
    categories/              # Categorías globales y por negocio (Prisma)
    inventory/               # Inventario y movimientos
    products/                # Catálogo de productos (migración en curso)
    sales/                   # Ventas, tickets, cortes de caja
    roles/, notifications/, payments/, etc.
    prisma/                  # PrismaService, hooks
```

## Módulos y endpoints destacados
| Módulo | Base URL | Descripción | Notas |
|--------|----------|-------------|-------|
| Auth | `/api/auth` | Registro, login, verificación y refresh | Retorna JWT con claims de rol y negocio activo |
| Users | `/api/users` | Perfil, actualización de datos y búsqueda | Requiere JWT, usa Prisma `usuarios` |
| Businesses | `/api/businesses` | Listado público, CRUD de negocios, branding, horarios, miembros | Pública: `GET /api/businesses`; operaciones mutables validan `usuarios_negocio` |
| Categories | `/api/categories` | Listado combinado (global + negocio) y CRUD | Todas las operaciones requieren negocio activo; globales son de solo lectura |
| Inventory | `/api/inventory` / `/api/movements` | Existencias por producto/negocio y registro de ajustes | Consistente con triggers PostgreSQL |
| Products | `/api/products` | Catálogo y media. Actualmente TypeORM, se migra a Prisma | Filtra por negocio vía inventario |
| Sales | `/api/sales` | Ventas, tickets, reportes diarios | Genera movimientos de inventario |
| Health | `/api/health` | Ping de disponibilidad | Sin auth |

Los detalles campo a campo se documentan en `Docs/API_*.md` y en los DTO correspondientes (`Backend/src/<modulo>/dto/`).

## Autenticación y autorización
- Estrategia JWT (`jwt.strategy.ts`) alimentada desde `AuthService`. El token incluye `id_usuario`, roles y banderas de verificación.
- Decorador `@Roles(...)` controla el acceso por rol; la guardia `RolesGuard` valida contra los claims del token.
- Muchos módulos exigen, además, pertenencia al negocio mediante consultas Prisma (`usuarios_negocio`).

## Acceso a datos
- `PrismaModule` ofrece `PrismaService` como singleton y maneja `enableShutdownHooks`.
- Los servicios usan Prisma para CRUD. Ejemplo `CategoriesService` combina categorías globales (`negocio_id = null`) y del negocio solicitado.
- Triggers definidos en `Docker/db/db_filacero.sql` mantienen integridad en inventario y ventas. Prisma opera respetando esas reglas.
- Mientras persistan módulos en TypeORM (`Product`), se evita mezclar llamadas Prisma/TypeORM dentro del mismo servicio/controller.

## Variables de entorno críticas
```
PORT=3000
DATABASE_URL=postgres://user:password@postgres:5432/filacero
JWT_SECRET=... (definido en despliegue)
JWT_EXPIRES_IN=3600s
```
- En el entorno Docker se leen desde `docker-compose.yml`.
- Si se ejecuta local fuera de Docker, crear `.env` en `Backend/`.

## Scripts npm
| Script | Descripción |
|--------|-------------|
| `npm run start` | Server productivo (sin watch) |
| `npm run start:dev` | Desarrollo con recarga |
| `npm run start:debug` | Igual que dev + inspector (`9229`) |
| `npm run build` | Compila a `dist/` |
| `npm run lint` | Reglas ESLint/TSLint aplicadas al backend |

## Ciclo de migraciones
1. Editar `prisma/schema.prisma`.
2. Ejecutar `docker exec -it filacero-backend npx prisma migrate dev --name <cambio>`.
3. Confirmar generación de cliente Prisma (`npx prisma generate`).
4. Sincronizar cambios con `Docker/db/db_filacero.sql` para instalaciones limpias.

## Testing y calidad
- Actualmente los tests unitarios/e2e están en planeación. Se recomienda cubrir primero `Auth`, `Categories` e `Inventory`.
- Cada refactor debe incluir smoke manual: login → selección de negocio → CRUD de categorías → registro de movimiento.

## Tareas pendientes relevantes
- Migrar módulo `products` a Prisma para eliminar TypeORM.
- Implementar rate limiting básico en auth y endpoints sensibles.
- Publicar documentación OpenAPI (Nest Swagger) para alinear contratos con frontend.