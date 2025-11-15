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
API_BASE_URL=http://localhost:3000
```
- En el entorno Docker se leen desde `docker-compose.yml`.
- Si se ejecuta local fuera de Docker, crear `.env` en `Backend/`.

## Scripts npm
| Script | Descripción |
|------run build` | Compila a `dist/` |
| `npm run lint` | Reglas ESLint/TSLint aplicadas al backend |

## Ciclo de migraciones
1. Editar `prisma/schema.prisma`.
2. Ejecutar `docker exec -it filacero-backend npx prisma migrate dev --name <cambio>`.
3. Confirmar generación de cliente Prisma (`npx prisma generate`).
4. Sincronizar cambios con `Docker/db/db_filacero.sql` para instalaciones limpias.

### Resolución de error P3006 (columna ya existe: owner_id)
El error `P3006` aparece cuando una migración intenta ejecutar un `ADD COLUMN` sobre una columna que ya está presente en la base. En el historial existe un caso duplicado para `owner_id` en `negocio`:

- `20251107140629_implement_owner_id` añade la columna y FK.
- `20251108123000_add_negocio_owner` intentaba repetir la operación provocando el conflicto.

Se hizo el segundo script idempotente usando un bloque `DO $$ BEGIN ... END $$` que:
1. Verifica existencia de la columna en `information_schema.columns` antes de `ALTER TABLE ADD COLUMN`.
2. Verifica existencia de la constraint en `pg_constraint` antes de agregar la FK.

Esto evita fallos al re-aplicar migraciones en entornos frescos vs. bases parcialmente inicializadas.

#### Pasos recomendados si reaparece P3006
1. Confirmar la migración conflictiva (`prisma migrate dev` mostrará el nombre del folder).
2. Revisar el SQL en `Backend/prisma/migrations/<folder>/migration.sql` para detectar operaciones no idempotentes.
3. Convertir `ADD COLUMN` / `ADD CONSTRAINT` en chequeos condicionales (como se hizo con `owner_id`).
4. Si la columna existe pero la migración debe marcarse como aplicada, usar:
  ```bash
  docker exec -it filacero-backend npx prisma migrate resolve --applied <migration_folder_name>
  ```
  Esto actualiza el historial sin ejecutar el SQL.
5. Re-ejecutar:
  ```bash
  docker exec -it filacero-backend npx prisma migrate dev
  ```

#### Prevención
- Evitar crear dos migraciones seguidas que toquen la misma columna antes de haber corrido `migrate dev`.
- No modificar la base manualmente sin reflejarlo en `schema.prisma` y una migración.
- Revisar diffs (`git diff`) del folder `prisma/migrations` antes de hacer commit.
- Nombrar migraciones claramente para detectar superposición (ej: `add_negocio_owner` vs `implement_owner_id`).

#### Limpieza futura
Cuando se confirme que la primera migración ya cubre el cambio y no se requiere la segunda para entornos legacy, puede eliminarse el folder duplicado en una rama de mantenimiento, anotando en la PR que se consolidó el historial. Mientras tanto, la versión idempotente evita bloqueos.

## Testing y calidad
- Actualmente los tests unitarios/e2e están en planeación. Se recomienda cubrir primero `Auth`, `Categories` e `Inventory`.
- Cada refactor debe incluir smoke manual: login → selección de negocio → CRUD de categorías → registro de movimiento.

## Tareas pendientes relevantes
- Migrar módulo `products` a Prisma para eliminar TypeORM.
- Implementar rate limiting básico en auth y endpoints sensibles.
- Publicar documentación OpenAPI (Nest Swagger) para alinear contratos con frontend.

## Documentación Adicional
Para un análisis exhaustivo del backend, consultar:
- **`backend-comprehensive-analysis.md`**: Análisis completo de arquitectura, módulos, endpoints, base de datos, testing, deployment y guías de desarrollo.
- **`backend-db-overview.md`**: Panorama detallado del esquema PostgreSQL y reglas de integridad.
- **`verificacion-usuarios.md`**: Flujo completo del sistema de verificación de email.
- **`implementaciones-negocio-rating.md`**: Documentación del módulo de valoraciones.
- **`backend-linting.md`**: Configuración ESLint y scripts de calidad.

## Subida de imágenes en Productos

Desde 2025-11 se habilitó la creación de productos con imagen adjunta. El endpoint acepta `multipart/form-data` con las siguientes claves:

- `file`: archivo de imagen (png/jpg/jpeg). Es el campo capturado por `FileInterceptor('file')`.
- `data`: string JSON con el payload del producto, por ejemplo:

```
{
  "nombre": "Café Latte",
  "precio": 3.5,
  "estado": "activo",
  "id_categoria": "Bebidas calientes", // puede ser ID numérico como string o nombre de categoría
  "media": [
    { "url": "https://..." } // opcional; si se sube `file`, no es necesario
  ]
}
```

Detalles de implementación:
- Los archivos se almacenan en `./uploads` (ruta del proceso). En Docker es `/app/uploads`.
- Los archivos se exponen estáticamente bajo `/uploads/...` gracias a `app.useStaticAssets(...)` en `main.ts`.
- La URL pública se construye usando `API_BASE_URL` (por defecto `http://localhost:3000`).
- Si el payload incluye `media[]`, y además se sube `file`, se normaliza para que haya una sola imagen principal.

Ejemplo de cURL:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "data={\"nombre\":\"Café Latte\",\"precio\":3.5,\"estado\":\"activo\"};type=application/json" \
  -F "file=@/ruta/local/latte.jpg;type=image/jpeg" \
  http://localhost:3000/api/products
```

Errores comunes:
- 400: no es JSON válido en `data` o formato de archivo no permitido.
- 401/403: token inválido o rol insuficiente.
- 413/431: cuerpo o cabeceras muy grandes (limitar tamaño y evitar cookies en proxys).