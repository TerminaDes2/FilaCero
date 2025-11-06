# Análisis Exhaustivo del Backend FilaCero

**Última actualización:** Octubre 26, 2025  
**Versión del backend:** 0.3.0  
**Branch activo:** `mod/auth`

---

## 1. Visión General

FilaCero Backend es una **API REST monolítica** construida sobre **NestJS 10**, diseñada para gestionar operaciones de puntos de venta (POS), inventarios multitienda y relaciones usuarios-negocios en el contexto de cafeterías universitarias. Utiliza **Prisma** como ORM principal contra **PostgreSQL 15+** y aplica autenticación mediante **JWT** con guardas de roles y verificación de email.

### Stack Tecnológico
- **Framework:** NestJS 10.x (Node >= 18)
- **ORM:** Prisma Client 6.x (migrando gradualmente desde TypeORM)
- **Base de Datos:** PostgreSQL 15+ (persistencia en Docker volumen)
- **Autenticación:** Passport JWT + bcrypt
- **Validación:** `class-validator` + `class-transformer`
- **Testing:** Jest (configurado, cobertura limitada)
- **Linting:** ESLint 9 + typescript-eslint (flat config)
- **Despliegue:** Docker Compose (backend + frontend + postgres + nginx)

---

## 2. Arquitectura de Módulos

### 2.1 Módulo Raíz (`AppModule`)
**Archivo:** `src/app.module.ts`  
**Responsabilidad:** Orquestación de módulos funcionales, inyección global de configuración y Prisma.

**Importaciones actuales:**
- `ConfigModule.forRoot({ isGlobal: true })` – Variables de entorno (.env)
- `PrismaModule` – Singleton Prisma Client
- `AuthModule` – Login/registro/verificación/JWT
- `UsersModule` – Gestión de perfiles
- `RolesModule` – CRUD de roles (actualmente seeds manuales)
- `BusinessesModule` – Alta de negocios, branding, empleados
- `BusinessRatingsModule` – Valoraciones y feedback
- `ProductsModule` – Catálogo de productos (migrando a Prisma)
- `CategoriesModule` – Categorías globales + por negocio
- `InventoryModule` – Stock y movimientos
- `SalesModule` – Ventas, tickets, cortes de caja

**Controladores directos:** `AppController` (deprecated, sin rutas) y `HealthController` (ping).

---

### 2.2 Auth (`auth/`)

#### **Descripción**
Maneja registro, login, verificación de correo, refresh tokens y emisión de JWT.

#### **Endpoints principales**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Crea usuario con `numero_cuenta`, `edad`, genera token verificación | Público |
| POST | `/api/auth/login` | Valida credenciales, retorna JWT | Público |
| POST | `/api/auth/verify` | Valida token de verificación, marca `verificado=true` | Público |
| POST | `/api/auth/refresh` | Renueva JWT (implementación pendiente) | Público |

#### **DTOs clave**
- `RegisterDto`: `correo_electronico`, `password`, `nombre`, `numero_telefono?`, `numero_cuenta?`, `edad?`
- `LoginDto`: `correo_electronico`, `password`
- `VerifyEmailDto`: `token`

#### **JWT Payload**
```typescript
{
  id_usuario: string,
  correo: string,
  role: string,
  role_name: string,
  verified: boolean,
  avatar_url?: string,
  credential_url?: string,
  numero_cuenta?: string,
  edad?: number
}
```

#### **Guardas**
- `AuthGuard('jwt')`: valida token en header `Authorization: Bearer <token>`
- `RolesGuard`: requiere decorador `@Roles(...)` para autorizar por rol
- Decorador custom `@Roles('admin', 'superadmin')` aplicado en endpoints sensibles

#### **Estrategia JWT**
**Archivo:** `jwt.strategy.ts`  
Extrae payload del token, valida firma con `JWT_SECRET` y carga datos del usuario desde Prisma (`usuarios`). Retorna objeto `req.user` con claims.

#### **Pendientes**
- Refresh token real (actualmente stub)
- Rate limiting en `/login` y `/register`
- Sistema de recuperación de contraseña

---

### 2.3 Users (`users/`)

#### **Descripción**
CRUD de perfiles de usuario autenticado.

#### **Endpoints**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/users/profile` | Perfil del usuario autenticado | JWT |
| PATCH | `/api/users/profile` | Actualiza nombre, teléfono, URLs, `numero_cuenta`, `edad`, contraseña | JWT |
| DELETE | `/api/users/profile` | Borrado lógico de cuenta | JWT |
| GET | `/api/users/:id` | Detalles públicos de usuario (nombre, avatar) | JWT (admin) |

#### **DTOs**
- `UpdateUserDto`: campos opcionales (`name`, `phoneNumber`, `avatarUrl`, `credentialUrl`, `accountNumber`, `age`, `newPassword`)

#### **Serialización**
- Convierte `BigInt` → `string` para IDs
- Omite `password_hash` en respuestas
- Fechas en formato ISO-8601

#### **Pendientes**
- Endpoint búsqueda por `numero_cuenta`
- Exportación masiva de usuarios (CSV)
- Logs de auditoría en cambios de perfil

---

### 2.4 Businesses (`businesses/`)

#### **Descripción**
Gestión de negocios (cafeterías), incluyendo branding, empleados y propietarios.

#### **Endpoints**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/businesses` | Listado público de negocios | Público |
| POST | `/api/businesses` | Crear negocio (usuario autenticado se convierte en `owner`) | JWT |
| GET | `/api/businesses/:id` | Detalle de negocio | Público |
| PATCH | `/api/businesses/:id` | Actualizar branding (`logo_url`, `hero_image_url`, etc.) | JWT (owner o admin) |
| DELETE | `/api/businesses/:id` | Borrado lógico de negocio | JWT (owner o superadmin) |
| POST | `/api/businesses/:id/employees` | Añadir empleado (`empleados` table) | JWT (owner o admin) |
| DELETE | `/api/businesses/:id/employees/:userId` | Remover empleado | JWT (owner o admin) |

#### **Modelo de permisos**
- Tabla `empleados`: `negocio_id`, `usuario_id`, `estado` (`activo`/`inactivo`)
- `owner_id` en `negocio` define propietario principal
- Servicios validan pertenencia antes de permitir mutaciones

#### **Pendientes**
- Horarios de apertura (tabla `horarios` en diseño)
- Geolocalización para búsqueda
- Suscripciones (premium features)

---

### 2.5 Business Ratings (`business-ratings/`)

#### **Descripción**
Sistema de valoraciones 1-5 estrellas + comentarios opcionales sobre negocios.

#### **Endpoints**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/businesses/:businessId/ratings` | Listado paginado de valoraciones | Público |
| GET | `/api/businesses/:businessId/ratings/summary` | Promedio y distribución de estrellas | Público |
| POST | `/api/businesses/:businessId/ratings` | Crear/actualizar valoración (upsert por usuario) | JWT + verificado |
| POST | `/api/businesses/:businessId/ratings/:ratingId` | Editar valoración (owner o admin) | JWT + verificado |
| DELETE | `/api/businesses/:businessId/ratings/:ratingId` | Eliminar valoración | JWT + verificado |

#### **Modelo de datos**
```prisma
model negocio_rating {
  id_rating  BigInt
  id_negocio BigInt
  id_usuario BigInt
  estrellas  Int @db.SmallInt (1-5)
  comentario String?
  creado_en  DateTime
  @@unique([id_negocio, id_usuario])
}
```

#### **Comportamiento clave**
- `upsertRating`: permite cambiar valoración sin crear duplicados
- `getSummary`: usa `aggregate` + `groupBy` Prisma para calcular distribución
- Validación de cuenta verificada (`ensureVerified`) en controller
- Paginación con metadatos (`page`, `limit`, `total`, `pages`)

#### **DTOs**
- `CreateBusinessRatingDto`: `estrellas` (1-5), `comentario?`
- `UpdateBusinessRatingDto`: parcial del anterior
- Respuesta: `BusinessRatingResponseDto` con información básica del usuario (`id`, `nombre`, `avatarUrl`)

---

### 2.6 Categories (`categories/`)

#### **Descripción**
Gestión de categorías de productos: **globales** (compartidas entre todos) y **específicas por negocio**.

#### **Endpoints**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/categories` | Listado combinado (globales + del negocio activo) | JWT |
| POST | `/api/categories` | Crear categoría propia del negocio | JWT (empleado o superior) |
| PATCH | `/api/categories/:id` | Actualizar categoría (solo si pertenece al negocio) | JWT |
| DELETE | `/api/categories/:id` | Borrar categoría (solo si pertenece al negocio) | JWT |

#### **Modelo**
```prisma
model categoria {
  id_categoria BigInt
  nombre       String @unique
  negocio_id   BigInt? // NULL = global
  @@unique([negocio_id, nombre])
}
```

#### **Lógica de negocio**
- `CategoriesService.findAll`: combina `WHERE negocio_id IS NULL OR negocio_id = :activeBusinessId`
- CRUD solo permite modificar categorías propias del negocio
- Categorías globales son read-only para usuarios estándar

---

### 2.7 Products (`products/`)

#### **Descripción**
Catálogo de productos con media, precios y métricas de popularidad.

#### **Endpoints**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/products` | Listado con filtros (`id_categoria`, `id_negocio`) | Público |
| POST | `/api/products` | Crear producto | JWT |
| GET | `/api/products/:id` | Detalle con media y métricas | Público |
| PATCH | `/api/products/:id` | Actualizar info + media | JWT |
| DELETE | `/api/products/:id` | Borrado lógico (`estado='inactivo'`) | JWT |

#### **Modelo**
```prisma
model producto {
  id_producto       BigInt
  id_categoria      BigInt?
  nombre            String
  descripcion       String?
  descripcion_larga String?
  codigo_barras     String? @unique
  precio            Decimal
  imagen_url        String?
  estado            String? // 'activo', 'inactivo'
  producto_media    producto_media[]
  producto_metricas_semanales producto_metricas_semanales[]
}
```

#### **Media management**
- Tabla `producto_media`: múltiples URLs por producto, una marcada como `principal`
- Endpoint PATCH acepta array `media`, sanitiza duplicados y garantiza una imagen principal

#### **Estado de migración**
- **Actualmente usa TypeORM** (`product.schema.ts`)
- **Pendiente migración completa a Prisma** (ver `backend-refactor-plan.md`)
- Coexiste con `inventario` (Prisma) mediante `id_producto`

---

### 2.8 Inventory (`inventory/`)

#### **Descripción**
Control de existencias por producto y negocio, con auditoría de movimientos.

#### **Endpoints**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/inventory` | Listado con filtros (`id_producto`, `id_negocio`) | Público |
| POST | `/api/inventory` | Crear registro de inventario | JWT |
| GET | `/api/inventory/:id` | Detalle | Público |
| PATCH | `/api/inventory/:id` | Ajustar `stock_minimo` o `cantidad_actual` | JWT |
| DELETE | `/api/inventory/:id` | Eliminar registro | JWT |
| GET | `/api/movements` | Historial de movimientos | JWT |
| POST | `/api/movements` | Registrar ajuste manual | JWT |

#### **Modelos**
```prisma
model inventario {
  id_inventario       BigInt
  id_negocio          BigInt
  id_producto         BigInt
  stock_minimo        Int @default(0)
  cantidad_actual     Int @default(0)
  fecha_actualizacion DateTime?
  @@unique([id_negocio, id_producto])
}

model movimientos_inventario {
  id_movimiento BigInt
  id_negocio    BigInt
  id_producto   BigInt
  delta         Int
  motivo        String // 'venta', 'ajuste', 'devolucion'
  id_venta      BigInt?
  id_detalle    BigInt?
  id_usuario    BigInt?
  fecha         DateTime @default(now())
}
```

#### **Triggers PostgreSQL**
- `fn_touch_inventario_fecha`: auto-actualiza `fecha_actualizacion` en cada cambio
- `fn_inventario_aplicar_delta`: aplica delta y valida no-negatividad
- `fn_trg_detalle_venta_inventario`: registra movimiento al insertar/actualizar detalle de venta

---

### 2.9 Sales (`sales/`)

#### **Descripción**
Gestión de ventas, tickets y cortes de caja.

#### **Endpoints**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/sales` | Crear venta con detalle | JWT |
| GET | `/api/sales` | Listado con filtros (`id_negocio`, `fecha`, `estado`) | JWT |
| GET | `/api/sales/:id` | Detalle completo con items | JWT |
| PATCH | `/api/sales/:id/close` | Cerrar venta y generar movimientos | JWT |
| PATCH | `/api/sales/:id/cancel` | Cancelar venta (estado='cancelada') | JWT |

#### **Flujo de venta**
1. `POST /api/sales` crea venta en estado `pendiente`
2. Se insertan `detalle_venta` (productos + cantidades)
3. Triggers disminuyen inventario y registran movimientos
4. `PATCH /:id/close` marca `estado='completada'` y recalcula total
5. Frontend imprime ticket

#### **Modelos involucrados**
- `venta`: encabezado (negocio, usuario, fecha, total, tipo_pago, estado)
- `detalle_venta`: líneas (producto, cantidad, precio_unitario)
- `tipo_pago`: catálogo (`efectivo`, `tarjeta`, `transferencia`)
- `corte_caja`: cierre de turno (monto inicial, final, ventas totales)

---

### 2.10 Roles (`roles/`)

#### **Descripción**
Catálogo de roles (`superadmin`, `admin`, `empleado`, `usuario`). Actualmente solo lectura.

#### **Endpoints**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/roles` | Listado de roles | JWT (admin) |

#### **Semillas**
Roles insertados en `db_filacero.sql`:
```sql
INSERT INTO roles (nombre_rol) VALUES
  ('superadmin'),
  ('admin'),
  ('empleado'),
  ('usuario')
ON CONFLICT (nombre_rol) DO NOTHING;
```

---

### 2.11 Prisma (`prisma/`)

#### **Archivo:** `src/prisma/prisma.service.ts`  
**Descripción:** Singleton que expone Prisma Client con hooks de shutdown.

#### **Configuración**
- `enableShutdownHooks`: cierra conexiones al terminar proceso
- Lee `DATABASE_URL` de `.env` o variables de entorno Docker

#### **Uso**
```typescript
constructor(private prisma: PrismaService) {}
async findUser(id: bigint) {
  return this.prisma.usuarios.findUnique({ where: { id_usuario: id } });
}
```

---

## 3. Base de Datos y Migraciones

### 3.1 Esquema Prisma
**Archivo:** `Backend/prisma/schema.prisma`  
**Tablas principales:** 17 modelos (usuarios, roles, negocio, producto, inventario, venta, etc.)

**Relaciones clave:**
- `usuarios ↔ roles` (muchos-a-uno)
- `negocio ↔ usuarios` (owner via `owner_id`)
- `empleados`: muchos-a-muchos `usuarios ↔ negocio`
- `inventario ↔ producto ↔ negocio` (única por combinación)
- `venta → detalle_venta → producto`
- `negocio_rating`: una valoración por usuario-negocio

### 3.2 Migraciones
**Ubicación:** `Backend/prisma/migrations/`  
**Estrategia:** Prisma Migrate (`npx prisma migrate dev`)

**Migraciones actuales:**
- `20250924_init`: esquema base
- `20251008012521_add_movimientos_inventario`: auditoría de stock
- `20251018120000_add_user_account_fields`: `numero_cuenta`, `edad`
- `20251020_add_verification_fields`: tokens de verificación
- `20251024_add_business_ratings`: valoraciones

**Comandos útiles:**
```bash
# Generar migración
docker exec -it filacero-backend npx prisma migrate dev --name <nombre>

# Aplicar migraciones
docker exec -it filacero-backend npx prisma migrate deploy

# Regenerar cliente
docker exec -it filacero-backend npx prisma generate
```

### 3.3 SQL Inicial
**Archivo:** `Docker/db/db_filacero.sql`  
**Uso:** Bootstrap de volumen vacío en PostgreSQL.

**Contenido:**
- Creación de tablas (DDL)
- Constraints, checks, unique indexes
- Triggers y funciones PL/pgSQL
- Seeds (roles, tipos de pago, categorías globales)

**Sincronización:** Debe mantenerse alineado con Prisma schema. Cambios en Prisma → actualizar SQL inicial.

### 3.4 Triggers y Funciones

#### `fn_touch_inventario_fecha`
Actualiza `inventario.fecha_actualizacion` en cada UPDATE.

#### `fn_inventario_aplicar_delta`
Aplica delta a `cantidad_actual`, valida no-negatividad, lanza excepción si insuficiente.

#### `fn_trg_detalle_venta_inventario`
Disminuye inventario al insertar detalle de venta, registra en `movimientos_inventario`.

#### `fn_recalcular_total_venta`
Recalcula `venta.total` sumando detalles.

#### `fn_touch_comentario_actualizado`
Actualiza `comentario.actualizado_en` al recibir feedback.

---

## 4. Autenticación y Autorización

### 4.1 Flujo de Autenticación
1. **Registro:** `POST /api/auth/register` → crea usuario, genera `verification_token`
2. **Verificación:** `POST /api/auth/verify` → valida token, marca `verificado=true`
3. **Login:** `POST /api/auth/login` → valida contraseña (bcrypt), genera JWT
4. **Autorización:** Header `Authorization: Bearer <token>` en requests protegidos

### 4.2 JWT Claims
```json
{
  "id_usuario": "123",
  "correo": "usuario@ejemplo.com",
  "role": "empleado",
  "role_name": "empleado",
  "verified": true,
  "avatar_url": "https://...",
  "credential_url": "https://...",
  "numero_cuenta": "A01234567",
  "edad": 21
}
```

### 4.3 Guardas
- `AuthGuard('jwt')`: valida token
- `RolesGuard`: valida roles con decorador `@Roles(...)`
- Verificación manual en algunos endpoints: `if (!req.user.verificado) throw ForbiddenException`

### 4.4 Estrategias de Seguridad
- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- Tokens de verificación únicos (128 chars), con expiración 24h
- JWT firmado con `JWT_SECRET`, expira en `JWT_EXPIRES_IN` (default 3600s)

**Pendientes:**
- Refresh token real (actualmente stub)
- Rate limiting en auth endpoints
- Rotación de JWT_SECRET en producción

---

## 5. Validación y Serialización

### 5.1 DTOs
Todos los endpoints usan DTOs con `class-validator`:

**Ejemplo:**
```typescript
export class CreateBusinessRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  estrellas!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
```

### 5.2 Transformación
- `class-transformer` aplica transformaciones (ej: trim strings)
- Interceptores custom para serializar BigInt → string
- Fechas convertidas a ISO-8601

### 5.3 Manejo de Errores
- Excepciones Nest: `NotFoundException`, `BadRequestException`, `ForbiddenException`
- Prisma exceptions capturadas (`P2025` → NotFound, `P2002` → Conflict)
- Triggers PostgreSQL lanzan excepciones específicas (ej: stock insuficiente)

---

## 6. Testing

### 6.1 Estado Actual
**Framework:** Jest + `@nestjs/testing`  
**Cobertura:** Limitada (~10% del código)

**Tests existentes:**
- `users/users.controller.spec.ts`: validación básica de endpoints
- `sales/sales.service.spec.ts`: mock de Prisma para crear venta

### 6.2 Estrategia de Testing
**Recomendaciones:**
1. **Unitarios:** Servicios con Prisma mockeado
2. **Integración:** Controladores con base de datos de test
3. **E2E:** Flujos completos (registro → login → crear negocio → venta)

**Comandos:**
```bash
npm run test           # Unitarios
npm run test:watch     # Watch mode
npm run test:cov       # Con cobertura
npm run test:e2e       # E2E (configurar)
```

### 6.3 Prioridades de Testing
1. **Auth:** registro, verificación, login, refresh
2. **Inventory:** movimientos, validación de stock
3. **Sales:** creación, cierre, cancelación
4. **Categories:** CRUD con validación de permisos
5. **Business Ratings:** upsert, summary, paginación

---

## 7. Linting y Calidad de Código

### 7.1 Configuración ESLint
**Archivo:** `Backend/eslint.config.mjs`  
**Versión:** ESLint 9 (flat config)

**Plugins:**
- `@typescript-eslint/parser`
- `typescript-eslint`
- Reglas recomendadas + type-checking

**Reglas clave:**
```javascript
{
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/no-floating-promises': 'error'
}
```

### 7.2 Comandos
```bash
npm run lint           # Ejecutar ESLint
```

### 7.3 Ignorados
- `dist/`, `node_modules/`, `generated/`

---

## 8. Documentación de APIs

### 8.1 Documentos Existentes
| Archivo | Descripción |
|---------|-------------|
| `API_Usuarios.md` | Endpoints de usuarios y perfil |
| `API_Businesses.md` | Negocios y empleados |
| `API_Categorias.md` | Categorías globales y por negocio |
| `API_Productos.md` | Catálogo y media |
| `API_Ventas.md` | Ventas y cortes de caja |

### 8.2 Formato
Cada documento incluye:
- Tabla de endpoints (método, ruta, descripción, auth)
- DTOs de request/response
- Ejemplos de payload
- Códigos de error

### 8.3 Pendientes
- Documentación OpenAPI/Swagger (Nest @nestjs/swagger)
- Postman collection actualizada
- Changelog de versiones

---

## 9. Tareas Pendientes y Roadmap

### 9.1 Migraciones Técnicas
- [ ] **Migrar Products a Prisma** (eliminar TypeORM)
- [ ] **Implementar refresh token real** (tabla `refresh_tokens`)
- [ ] **Rate limiting** (auth endpoints, búsquedas)
- [ ] **Logs estructurados** (Winston/Pino)

### 9.2 Funcionalidades
- [ ] **Recuperación de contraseña** (email con token)
- [ ] **Búsqueda por numero_cuenta** (endpoint dedicado)
- [ ] **Horarios de negocios** (tabla + validación)
- [ ] **Geolocalización** (coordenadas en negocios)
- [ ] **Notificaciones push** (módulo pendiente)
- [ ] **Reportes avanzados** (ventas por período, top productos)

### 9.3 Calidad
- [ ] **Cobertura de tests > 70%** (unitarios + e2e)
- [ ] **CI/CD pipeline** (GitHub Actions)
- [ ] **Monitoreo** (Sentry, Prometheus)
- [ ] **Documentación OpenAPI** (Swagger UI)

---

## 10. Guías de Desarrollo

### 10.1 Añadir un Nuevo Módulo

**Ejemplo:** Crear módulo `promotions`

```bash
# 1. Generar estructura
docker exec -it filacero-backend npx nest g module promotions
docker exec -it filacero-backend npx nest g controller promotions
docker exec -it filacero-backend npx nest g service promotions

# 2. Definir modelo en schema.prisma
# 3. Generar migración
docker exec -it filacero-backend npx prisma migrate dev --name add_promotions

# 4. Crear DTOs en promotions/dto/
# 5. Implementar servicio con PrismaService
# 6. Añadir guardas en controlador
# 7. Actualizar AppModule
# 8. Documentar en Docs/API_Promotions.md
```

### 10.2 Modificar Esquema de Base de Datos

```bash
# 1. Editar Backend/prisma/schema.prisma
# 2. Generar migración
npx prisma migrate dev --name <descripcion>

# 3. Regenerar cliente
npx prisma generate

# 4. Actualizar Docker/db/db_filacero.sql
# 5. Actualizar servicios afectados
# 6. Actualizar tests
# 7. Documentar en backend-db-overview.md
```

### 10.3 Agregar Endpoint Protegido

```typescript
@Post('sensitive-action')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin', 'superadmin')
async sensitiveAction(@Req() req, @Body() dto: ActionDto) {
  // Validar verificación
  if (!req.user.verificado) {
    throw new ForbiddenException('Cuenta no verificada');
  }
  
  // Validar pertenencia a negocio si aplica
  const belongs = await this.checkBusinessMembership(
    req.user.id_usuario,
    dto.businessId
  );
  if (!belongs) {
    throw new ForbiddenException('No perteneces a este negocio');
  }
  
  return this.service.performAction(dto);
}
```

---

## 11. Convenciones de Código

### 11.1 Nomenclatura
- **Archivos:** `kebab-case.ts` (ej: `business-ratings.service.ts`)
- **Clases:** `PascalCase` (ej: `BusinessRatingsService`)
- **Métodos:** `camelCase` (ej: `upsertRating`)
- **DTOs:** sufijo `Dto` (ej: `CreateBusinessRatingDto`)
- **Interfaces:** prefijo `I` opcional (ej: `IUser` o `User`)

### 11.2 Estructura de Archivos
```
src/
  feature-name/
    dto/
      create-feature.dto.ts
      update-feature.dto.ts
    feature-name.controller.ts
    feature-name.service.ts
    feature-name.module.ts
    feature-name.types.ts (interfaces custom)
```

### 11.3 Imports
```typescript
// 1. Nest
import { Injectable, NotFoundException } from '@nestjs/common';

// 2. Third-party
import { Prisma } from '@prisma/client';

// 3. Internal
import { PrismaService } from '../prisma/prisma.service';
import { CreateDto } from './dto/create.dto';
```

### 11.4 Manejo de BigInt
```typescript
// Convertir a string en respuestas
return {
  id: Number(entity.id_rating),
  userId: entity.id_usuario.toString()
};

// Parsear en servicios
parseBigInt(value: string): bigint {
  return BigInt(value);
}
```

---

## 12. Variables de Entorno

### 12.1 Requeridas
```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=3600s
```

### 12.2 Opcionales
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_CORS=true
FRONTEND_URL=http://localhost:3001
```

### 12.3 Docker Compose
Variables inyectadas desde `docker-compose.yml`:
```yaml
backend:
  environment:
    DATABASE_URL: postgres://filacero:password@postgres:5432/filacero
    JWT_SECRET: ${JWT_SECRET}
```

---

## 13. Despliegue

### 13.1 Desarrollo Local
```bash
# Con Docker
docker compose up -d

# Sin Docker (requiere PostgreSQL local)
cd Backend
npm install
npx prisma generate
npm run start:dev
```

### 13.2 Producción
```bash
# Build
npm run build

# Ejecutar migraciones
npx prisma migrate deploy

# Start
npm run start:prod
```

### 13.3 Salud del Sistema
**Endpoint:** `GET /api/health`  
**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-26T23:00:00.000Z"
}
```

---

## 14. Recursos Adicionales

### 14.1 Documentación Interna
- `Docs/Backend.md` – Resumen arquitectura
- `Docs/backend-db-overview.md` – Esquema detallado
- `Docs/verificacion-usuarios.md` – Flujo verificación
- `Docs/backend-linting.md` – Configuración ESLint
- `Docs/implementaciones-negocio-rating.md` – Ratings module

### 14.2 Referencias Externas
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## 15. Changelog Reciente

### Octubre 2025
- ✅ Implementación completa de Business Ratings
- ✅ Migración campos usuarios (`numero_cuenta`, `edad`)
- ✅ Sistema de verificación de email
- ✅ Configuración ESLint 9 (flat config)
- ✅ Documentación exhaustiva

### Pendiente próxima iteración
- 🔄 Migración Products a Prisma
- 🔄 Tests E2E completos
- 🔄 Swagger/OpenAPI
- 🔄 Rate limiting

---

## 16. Contacto y Contribución

**Backend Lead:** [Tu nombre]  
**Equipo:** [Nombres equipo]  
**Branch principal:** `main`  
**Branch desarrollo:** `mod/auth`

**Workflow:**
1. Crear feature branch desde `mod/auth`
2. Implementar + tests
3. Pull request con descripción detallada
4. Code review (2 aprobaciones)
5. Merge a `mod/auth`
6. Deploy a staging
7. Testing QA
8. Merge a `main` y deploy producción

---

**Última actualización:** Octubre 26, 2025  
**Versión documento:** 1.0
