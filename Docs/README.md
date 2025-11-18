# FilaCero · Documentación Integral

Esta guía reúne todo lo necesario para levantar, entender y extender el proyecto end-to-end: entorno, contenedores, base de datos Prisma/PostgreSQL, módulos NestJS y las capacidades actuales del frontend POS en Next.js.

## 📁 Estructura de Documentación

La documentación está organizada en las siguientes carpetas temáticas:

### [📡 APIs](./apis/)
Documentación de endpoints REST por módulo:
- [API Businesses](./apis/API_Businesses.md) - Gestión de negocios
- [API Categorías](./apis/API_Categorias.md) - CRUD de categorías
- [API Productos](./apis/API_Productos.md) - Catálogo de productos
- [API SMS](./apis/API_SMS.md) - Servicio de mensajería
- [API Usuarios](./apis/API_Usuarios.md) - Autenticación y gestión
- [API Ventas](./apis/API_Ventas.md) - Sistema de ventas

### [🏗️ Arquitectura](./arquitectura/)
Documentos sobre diseño y estructura del sistema:
- [Arquitectura](./arquitectura/Arquitectura.md) - Visión general del sistema
- [Backend](./arquitectura/Backend.md) - Stack NestJS + Prisma
- [Frontend](./arquitectura/Frontend.md) - Next.js 13 App Router
- [Infraestructura](./arquitectura/Infraestructura.md) - Docker y servicios
- [Frontend API Contract](./arquitectura/frontend-api-contract.md) - Contratos de integración

### [⚙️ Sistemas](./sistemas/)
Implementaciones completas de subsistemas:
- [Sistema de Pagos](./sistemas/SISTEMA-PAGOS.md) - Integración Stripe MVP
- [Sistema de Pagos - Implementación](./sistemas/SISTEMA_PAGOS_IMPLEMENTACION.md) - Fases 1-8 completas
- [Sistema de Pagos - Hardening](./sistemas/SISTEMA_PAGOS_HARDENING_COMPLETO.md) - Seguridad y producción
- [Sistema de Pedidos - Implementación](./sistemas/SISTEMA_PEDIDOS_IMPLEMENTACION.md) - Gestión de órdenes
- [Sistema de Pedidos - Fase 2](./sistemas/SISTEMA_PEDIDOS_FASE2_BACKEND.md) - Estados y transiciones
- [Plan Sistema Pedidos](./sistemas/PLAN_SISTEMA_PEDIDOS.md) - Roadmap completo

### [🧩 Módulos](./modulos/)
Documentación de módulos específicos:
- [Módulo Empleados](./modulos/Modulo_Empleados.md) - Gestión de personal
- [Business Ratings](./modulos/implementaciones-negocio-rating.md) - Sistema de calificaciones
- [Feedback Módulo](./modulos/feedback-modulo.md) - Retroalimentación general

### [🗄️ Database](./database/)
Información sobre base de datos:
- [Backend DB Overview](./database/backend-db-overview.md) - Esquema y relaciones
- [Verificación Usuarios](./database/verificacion-usuarios.md) - Scripts de validación

### [✨ Features](./features/)
Características y funcionalidades del sistema:
- [Producto Historial Precio](./features/PRODUCTO_HISTORIAL_PRECIO.md) - Tracking de precios
- [Deploy Historial Precio](./features/DEPLOY_PRODUCTO_HISTORIAL_PRECIO.md) - Despliegue de feature
- [Funcionalidades FilaCero](./features/funcionalidades-filacero.md) - Catálogo completo
- [Roadmap Funcionalidades](./features/roadmap-funcionalidades.md) - Planificación features

### [🚀 Deployment](./deployment/)
Guías de despliegue y desarrollo:
- [Contenedores](./deployment/Contenedores.md) - Docker Compose setup
- [Tutorial Desplegar Contenedores](./deployment/tutorial_desplegar_contenedores.txt) - Paso a paso
- [Desarrollo](./deployment/Desarrollo.md) - Ambiente de desarrollo

### [🧪 Testing](./testing/)
Documentación de pruebas:
- [Test Business Ratings](./testing/TEST_BUSINESS_RATINGS.md) - Suite de pruebas ratings

### [📊 Análisis](./analisis/)
Análisis técnicos y planes de refactorización:
- [Backend Comprehensive Analysis](./analisis/backend-comprehensive-analysis.md) - Análisis completo
- [Backend Refactor Plan](./analisis/backend-refactor-plan.md) - Plan de refactorización
- [Backend Linting](./analisis/backend-linting.md) - Configuración linting
- [Backend Change Log Oct 2025](./analisis/backend-change-log-oct-2025.md) - Cambios recientes

### [📋 Pull Requests](./pull-requests/)
Documentación de PRs y resúmenes de implementaciones:
- [PR Fase 2 Pedidos](./pull-requests/PR_FASE2_PEDIDOS.md) - Pull request fase 2
- [Resumen Fase 2](./pull-requests/RESUMEN_FASE2.md) - Resumen de implementación

---

## 0. Resumen ejecutivo
- **Objetivo del sprint:** consolidar el stack POS sobre Prisma, habilitar CRUD administrativos (productos, inventario, categorías) y dejar lista la base documental para stakeholders técnicos y de negocio.
- **Estado general:** backend estable sobre Prisma + NestJS, frontend POS operable con panel de administración, infraestructura reproducible vía Docker; pendientes principales centrados en pruebas automatizadas y auth avanzada.
- **Impacto:** se habilita la gestión integral de catálogo e inventario desde la interfaz POS, asegurando consistencia de datos gracias a triggers SQL y validaciones Prisma.

### Hitos recientes (Sept–Nov 2025)
- Migración de productos e inventario a Prisma con manejo de `BigInt` coherente.
- Adición del módulo de categorías (`/api/categories`) y semillas iniciales.
- Implementación de paneles de edición/stock en el frontend con sincronización de inventario.
- Corrección de flujo de registro (`RegisterLayout`) eliminando props obsoletas.
- Regeneración y empaquetado del cliente Prisma (artefactos en `Backend/generated/prisma`).
- Ajustes en `docker-compose.yml` para reconstrucciones rápidas del backend y parametrización del negocio (`NEXT_PUBLIC_NEGOCIO_ID`).
- **Sistema de Pagos completo** con integración Stripe (tarjeta, SPEI), testing E2E/Unit, seguridad hardening, Swagger, métricas y documentación productiva.

---

## 1. Panorama del sistema
- **Monorepo** con dos aplicaciones: `Backend/` (NestJS 10 + Prisma + JWT) y `Frontend/` (Next.js 13 App Router + Tailwind + Zustand).
- **Orquestación con Docker Compose**: backend, frontend y PostgreSQL en la red `filacero-net`.
- **Persistencia** vía Prisma Client sobre PostgreSQL, apoyado por un script SQL de _hardening_ (`Docker/db/db_filacero.sql`) que crea tablas, constraints, triggers e inserta catálogos base.
- **Dominio actual**: autenticación básica, gestión de usuarios, catálogo de productos, inventario físico y categorías; frontend POS con panel administrativo para crear/editar productos y stock.

```
┌───────────┐     HTTP REST      ┌──────────────┐     Prisma + SQL     ┌──────────────┐
│ Navegador │ ─────────────────▶ │ Frontend POS │ ───────────────────▶ │ NestJS API   │
└───────────┘                    │ Next.js 13   │                      │ PrismaClient │
											└──────────────┘                      └─────┬────────┘
																					 consultas    │
																					 mutaciones    ▼
																				  ┌────────────────┐
																				  │ PostgreSQL 13  │
																				  └────────────────┘
```

---

## 2. Requisitos y preparación

| Herramienta            | Versión sugerida                 | Notas |
|------------------------|----------------------------------|-------|
| Node.js                | ≥ 18 (LTS)                       | Necesario si se ejecutan apps fuera de Docker |
| npm                    | ≥ 9                              | Administrador de paquetes en ambos proyectos |
| Docker Desktop         | Última estable (Compose v2)      | Compose construye y orquesta los tres servicios |
| PowerShell / Bash      | PowerShell 5.1 (Windows)         | Ajustar comandos al shell indicado |

> ⚠️ El backend usa tipos `BigInt` y `Decimal`. Asegurarse de que la base esté creada con PostgreSQL ≥ 13 (la imagen oficial ya lo cumple).

---

## 3. Puesta en marcha con Docker Compose

1. Clona el repositorio y coloca un archivo `.env` si necesitas overrides (la mayoría de variables vienen inyectadas por compose).
2. Ejecuta en la raíz del proyecto:
	```powershell
	docker compose up --build
	```
	- Backend: <http://localhost:3000>, debug Node en `9229`.
	- Frontend POS: <http://localhost:3001>.
	- PostgreSQL: `localhost:5432` (`user/password`, base `filacero`).
3. El primer arranque inicializa la BD ejecutando `Docker/db/db_filacero.sql` dentro de `postgres`.
4. Para reconstruir solo el backend tras cambios en código o dependencias:
	```powershell
	docker compose up -d --no-deps --build backend
	```

### Servicios definidos (`docker-compose.yml`)

| Servicio | Build / Imagen                       | Puertos expuestos | Variables destacadas |
|----------|--------------------------------------|-------------------|-----------------------|
| backend  | `Backend/` + `Docker/backend.Dockerfile` | 3000 (HTTP), 9229 (debug) | `DATABASE_URL=postgres://user:password@postgres:5432/filacero` |
| frontend | `Frontend/` + `Docker/frontend.Dockerfile` (target `dev`) | 3001→3000 | `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_NEGOCIO_ID`, `NODE_ENV` |
| postgres | `postgres:13` + script init           | 5432              | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` |

Volúmenes:
- `postgres_data` persiste los datos de la base.
- El frontend monta `./Frontend:/app` para hot reload; los volúmenes del backend están comentados por compatibilidad con entornos read-only (activar si se requiere `hot reload`).

---

## 4. Backend NestJS + Prisma

### 4.1 Módulos principales (`Backend/src/`)

| Módulo        | Carpeta                          | Endpoints clave                                    | Notas |
|---------------|----------------------------------|----------------------------------------------------|-------|
| Auth          | `auth/`                          | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` | JWT + Passport. Usa `RolesGuard` para RBAC. |
| Users         | `users/`                         | `GET /api/users/me`, `PUT /api/users/:id`, `DELETE /api/users/:id` | Acceso protegido por JWT; valida que el usuario solo modifique su propio perfil. |
| Roles         | `roles/`                         | Soporte interno para guardas                        | Roles `admin`, `superadmin`, etc. |
| Products      | `products/`                      | CRUD completo en `/api/products`                    | Migrado a Prisma, filtros `search` y `status`. |
| Inventory     | `inventory/`                     | `/api/inventory` con filtros `id_negocio`, `id_producto` | Requiere rol admin para mutaciones. Controla FKs y errores P2003/P2025. |
| Categories    | `categories/`                    | `/api/categories` CRUD                             | Admin-only en mutaciones; IDs tipo `BigInt`. |
| Health check  | `health.controller.ts`           | `GET /health`                                      | Verifica que el servicio está arriba. |

Todos los módulos comparten `PrismaService` (`prisma/prisma.service.ts`) para acceder al cliente generado.

### 4.2 Workflow con Prisma

1. Archivo fuente del esquema: `Backend/prisma/schema.prisma`.
2. Tras modificar el esquema, ejecutar:
	```powershell
	# Dentro del contenedor backend o con Node local
	docker exec -it filacero-backend npx prisma generate
	```
3. Para crear migraciones (recomendado a partir de ahora):
	```powershell
	docker exec -it filacero-backend npx prisma migrate dev --name <descripcion>
	```
	- La migración inicial se registró en `Backend/prisma/migrations/20250924_init`.
4. El cliente generado vive en `Backend/generated/prisma/` y se consume vía `@prisma/client`.

### 4.3 Esquema de datos (extracto)

| Modelo Prisma  | Propósito                          | Relaciones destacadas |
|----------------|------------------------------------|------------------------|
| `roles`        | Catálogo RBAC                      | `usuarios.role` |
| `usuarios`     | Cuentas con hash de contraseña     | `venta`, `comentario`, `feedback` |
| `categoria`    | Catálogo de categorías             | `producto.categoria` |
| `producto`     | Catálogo de productos (POS)        | `inventario`, `detalle_venta`, `categoria` |
| `inventario`   | Stock por negocio y producto       | Relación única `(id_negocio, id_producto)` |
| `negocio`      | Información de cada sucursal       | Enlaza ventas, inventario, cortes de caja |
| `venta`        | Ticket POS                         | `detalle_venta`, `usuarios`, `tipo_pago` |
| `detalle_venta`| Items por venta                    | Dispara triggers de inventario/total |

Características técnicas:
- Claves primarias `BigInt` autoincrementales (compatibles con el script SQL).
- Propiedades monetarias usan `Decimal` (`@db.Decimal(12,2)` o `14,2`).
- `categoria.nombre` y `producto.codigo_barras` son únicos; Prisma lanza error `P2002` si hay duplicados.
- Accesos a `BigInt` requieren castear (`BigInt(id)` en servicios).

### 4.4 Script SQL de hardening (`Docker/db/db_filacero.sql`)

- Crea toda la base relacional inicial (tablas, FKs, índices).
- Refuerza reglas de negocio (`CHECK` de estados, constraint de inventario único, triggers para mantener `inventario.fecha_actualizacion` y recalcular totales de ventas).
- Inserta catálogos obligatorios: roles (`superadmin`, `admin`, `empleado`, `usuario`), tipos de pago y cinco categorías base.
- Define `movimientos_inventario` y funciones auxiliares para auditar ajustes de stock.

> El script se ejecuta automáticamente en el primer arranque del volumen `postgres_data`. Para reaplicar los cambios limpiar el volumen (`docker compose down -v`).

### 4.5 Manejo de errores en servicios
- Se utilizan excepciones NestJS (`NotFoundException`, `BadRequestException`).
- Errores Prisma (`P2002`, `P2003`, `P2025`) se traducen a mensajes claros en productos, inventario y categorías.
- Guardas JWT (`AuthGuard('jwt')`) + `RolesGuard` protegen mutaciones sensibles.

### 4.6 Detalle por módulo

#### Auth (`Backend/src/auth/`)
- **Controlador:** `AuthController` expone `POST /auth/login`, `POST /auth/register`, `GET /auth/me`.
- **Service:** valida credenciales contra `usuarios`, firma tokens JWT con `@nestjs/jwt`.
- **DTO:** `LoginDto`, `RegisterDto`, `UpdateUserDto` con validaciones `class-validator`.
- **Estrategia:** `JwtStrategy` extrae token Bearer y adjunta al request `req.user` (contiene `id_usuario`, `nombre`, `id_rol`).
- **Guardas auxiliares:** `RolesGuard` + decorador `@Roles(...roles)` para RBAC granular.

#### Users (`Backend/src/users/`)
- `UsersController` protegido por `AuthGuard('jwt')`.
- Endpoints documentados: `GET /api/users/me`, `PUT /api/users/:id`, `DELETE /api/users/:id`.
- `UsersService` usa Prisma para lecturas y escrituras. Hash de contraseñas con `bcrypt` si se envía `newPassword`.
- **Validación permisos:** se compara `req.user.id_usuario` con el parámetro `id` antes de mutar/eliminar.

#### Roles (`Backend/src/roles/`)
- Servicio auxiliar que consulta tabla `roles` (sembrada con `superadmin`, `admin`, `empleado`, `usuario`).
- Apoya al guard de roles y al flujo de registro para asignar rol por defecto.

#### Products (`Backend/src/products/`)
- Controlador en `/api/products` con guardas `AuthGuard('jwt')` + `RolesGuard` para mutaciones.
- `ProductsService` gestiona filtros (`search`, `status`) y convierte IDs a `BigInt`.
- DTOs (`CreateProductDto`, `UpdateProductDto`) aseguran presencia de `nombre`, `precio`, validan `estado` y `id_categoria`.
- Integra con inventario via FKs y permite cambiar estado activo/inactivo.

#### Inventory (`Backend/src/inventory/`)
- Endpoints: `GET /api/inventory` (filtros `id_negocio`, `id_producto`, `limit`, `offset`), `POST`, `PATCH`, `DELETE`.
- Valida claves foráneas; traduce `P2003` a `BadRequestException` con mensaje específico.
- Soporta creación sin `id_negocio` cuando se usa manualmente (panel permite indicarlo) y convierte fechas ISO a `Date`.

#### Categories (`Backend/src/categories/`)
- CRUD completo en `/api/categories` con guardas admin para mutaciones.
- `CategoriesService` trimmea nombres, maneja `P2002` (duplicados) y `P2025` (no encontrado).
- Expuesto para integrarse con frontend (pendiente fetch dinámico en selects).

### 4.7 Flujos críticos de negocio
- **Alta de producto:**
	1. `POST /api/products` crea registro en `producto`.
	2. Si se envía `id_categoria`, se castea a `BigInt` y se validan FKs.
	3. Frontend (AdminProductGrid/NewProductPanel) opcionalmente crea inventario inicial (`POST /api/inventory`).
- **Actualización de stock:**
	1. Panel `EditStockPanel` detecta si ya existe `inventario` para `(negocio, producto)`.
	2. Si existe → `PATCH /api/inventory/:id`; si no → `POST` con `id_negocio`.
	3. Trigger `fn_touch_inventario_fecha` actualiza `fecha_actualizacion` automáticamente.
- **Venta (preparado en SQL):** triggers `fn_inventario_aplicar_delta` y `fn_recalcular_total_venta` garantizan ajustes de inventario y totales cuando se inserten registros en `detalle_venta` (feature futura).
- **Auth + roles:** tokens emitidos por `AuthService` incluyen `id_rol`; `RolesGuard` evita acceso a admins-only.

### 4.8 Seguridad, observabilidad y mantenimiento
- **JWT expiración:** configurable desde `.env`; recomendamos rotar claves y limitar duración a ≤ 24h.
- **Contraseñas:** se almacenan como `bcrypt` (por defecto 10 salt rounds).
- **Logs:** actualmente consola estándar; plan a corto plazo es introducir `nestjs-pino` para logs estructurados.
- **Healthcheck:** `GET /health` permite monitoreo en contenedores (útil para orquestadores futuros).
- **Backups BD:** al usar volumen Docker, se sugiere automatizar `pg_dump` periódico (no implementado aún).

---

## 5. Frontend POS (Next.js 13)

### 5.1 Estructura general (`Frontend/`)

| Ruta / Archivo                                    | Rol |
|---------------------------------------------------|-----|
| `app/layout.tsx`, `app/globals.css`               | Layout global y estilos base |
| `app/page.tsx`                                    | Landing inicial |
| `app/auth/register/page.tsx`                      | Flujo de registro conectado a `useUserStore` |
| `app/productos/page.tsx`                          | Entrada al POS de productos (`ProductsPage`) |
| `src/lib/api.ts`                                  | Wrapper `api` centraliza fetch, headers y token localStorage |
| `src/components/pos/products/`                    | Grid POS, paneles de creación/edición, vista admin |
| `src/state/userStore.tsx`                         | Zustand store para auth/UI |

### 5.2 Capacidades actuales del POS

- **ProductsPage**: barra de búsqueda, selector de vista (grid/list) y panel lateral para crear productos (`NewProductPanel`).
- **ProductGrid**: lista productos consumiendo `/api/products` y fusiona stock desde `/api/inventory`. Muestra estados «Agotado», «Bajo stock» y soporta modo lista.
- **AdminProductGrid**: vista administrativa con acciones de edición, activación/desactivación, eliminación y edición de stock. Utiliza paneles modales (`EditProductPanel`, `EditStockPanel`).
- **Inventario integrado**: si `NEXT_PUBLIC_NEGOCIO_ID` está definido, al crear un producto se genera stock inicial; los paneles permiten crear o actualizar inventario según exista registro previo.
- **Flujo de registro (auth)**: `RegisterLayout` escoge tipo de cuenta (owner/customer) y sincroniza el rol con `Zustand` en lugar de pasar props inexistentes (corrige el error `accountType`).
- **Feedback visual:** badges de estado, inputs con estilos POS, overlays modales accesibles (ESC cierra panel).

### 5.3 Arquitectura de componentes y estado
- **Componentes base POS:** `ProductCard`, `ProductGrid`, `AdminProductGrid` siguen un patrón container-presentational. Los containers manejan fetch y estado; los presentacionales renderizan tarjetas/listas.
- **Paneles laterales (drawer):** `NewProductPanel`, `EditProductPanel`, `EditStockPanel` comparten layout (overlay + aside). Se controla apertura desde el componente padre (`ProductsPage` o `AdminProductGrid`).
- **Estado global:** `useUserStore` (Zustand) almacena información de sesión/rol y utilidades como `reset()`. Permite que vistas distintas sin prop drilling accesan el rol.
- **Gestión de API:** se centraliza en `src/lib/api.ts`. Este wrapper añade `Authorization` si hay token, maneja errores (lanza `ApiError` con status y mensaje) y opcionalmente loguea endpoints en desarrollo.
- **Resiliencia ante inventario faltante:** si `/api/inventory` falla se muestra el catálogo igualmente y se loggea un warning.
- **Drivers de UI:** se sigue un «look and feel» consistente con tokens `var(--pos-*)` definidos en CSS global. Los botones `Editar/Stock/Desactivar` usan badges y microinteracciones.

### 5.4 Variables de entorno frontend
- `NEXT_PUBLIC_API_BASE`: base absoluta de la API (por defecto `http://localhost:3000/api`).
- `NEXT_PUBLIC_NEGOCIO_ID`: ID de negocio usado para vincular inventario. Puede configurar stock automático al crear productos.

### 5.5 Scripts disponibles (`Frontend/package.json`)

| Script      | Descripción                              |
|-------------|------------------------------------------|
| `npm run dev`   | Next.js en modo desarrollo (hot reload) |
| `npm run build` | Compilación producción (`.next/`)       |
| `npm run start` | Sirve el build construido               |
| `npm run lint`  | Linter de Next (ESLint)                 |
| `npm run type-check` | Verificación TypeScript sin emitir |

---

## 6. Flujo de desarrollo recomendado

1. **Levantar stack con Docker** (`docker compose up --build`).
2. **Backend**: editar código en `Backend/src`. Para usar hot reload, reactivar los volúmenes comentados y cambiar el comando a `npm run start:dev` en el servicio backend.
3. **Regenerar Prisma** cuando se toquen modelos (`docker exec -it filacero-backend npx prisma generate`).
4. **Recrear migraciones** con `prisma migrate dev` y commitear la carpeta `prisma/migrations/`.
5. **Frontend**: el contenedor ya ejecuta `npm run dev`. Los cambios se reflejan al instante. Para entornos sin Docker, se puede ejecutar manualmente:
	```powershell
	cd Frontend
	npm install
	npm run dev
	```
6. **Validaciones**:
	- Backend: `npm run build` asegura que TypeScript compila.
	- Frontend: `npm run lint` y `npm run type-check`.
	- (Pendiente) Añadir pruebas unitarias/e2e.

> 💡 Usa `docker compose logs -f backend` y `docker compose logs -f frontend` para observar errores en caliente.

---

## 7. Inicialización y mantenimiento de la base de datos

| Escenario                                | Pasos |
|------------------------------------------|-------|
| **Instalación limpia**                   | `docker compose down -v` → `docker compose up --build` (reaplica script SQL y recrea volumen) |
| **Sincronizar cambios Prisma**           | Ejecutar `prisma migrate dev` dentro del contenedor backend |
| **Solo regenerar cliente Prisma**        | `npx prisma generate` |
| **Sembrar datos adicionales**            | Agregar SQL a `Docker/db/` o implementar seeds via `prisma` (pendiente) |
| **Acceder manualmente a PostgreSQL**     | `docker exec -it filacero-postgres psql -U user -d filacero` |

Consideraciones:
- El script SQL define triggers que dependen del nombre de las tablas; mantener consistencia al modificar el esquema.

---

## 8. Estado actual y próximos pasos sugeridos

✅ Implementado
- API con NestJS + Prisma funcionando para autenticación, productos, inventario y categorías.
- Script SQL robusto con constraints, índices y semillas de catálogos.
- Frontend POS con panel administrable (crear/editar/eliminar productos, modificar stock, estados activos/inactivos).
- Fixes de flujo de registro (sin props obsoletas) y consumo consistente de inventario.
- Docker compose estable con rebuild dedicado de backend y bandera `NEXT_PUBLIC_NEGOCIO_ID`.

🚧 Recomendado continuar
- Añadir **tests** (Nest e2e + React Testing Library) y pipeline CI.
- Completar módulo de usuarios/roles exponiendo endpoints REST faltantes.
- Persistir categorías dinámicas en el frontend (actualmente listas estáticas en los selects).
- Configurar guardas JWT globales en productos/inventario para producción.
- Documentar y automatizar seeds Prisma (en lugar de SQL plano) una vez consolidada la migración.

### 8.1 Cronograma de avances
| Fecha (2025) | Entrega | Impacto |
|--------------|---------|---------|
| 12 Sep       | Integración inicial Prisma + migración de productos | Base para abandonar TypeORM gradualmente |
| 20 Sep       | Ajustes docker-compose + rebuild selectivo backend  | Ciclo de despliegue más rápido (menos downtime) |
| 24 Sep       | Migración `20250924_init` y regeneración cliente     | Estado inicial de Prisma versionado |
| 28 Sep       | Panel POS admin (editar/stock) + helpers inventario | Mejora UX y reduce dependencias de consola SQL |
| 02 Oct       | Módulo categorías + semillas SQL                    | Catálogo listo para UI futura |
| 04 Oct       | Documentación integral + alineación APIs            | Base para reporte de stakeholders |

### 8.2 Riesgos y mitigaciones
- **Falta de pruebas automatizadas:** riesgo de regresiones en futuras iteraciones. *Mitigación:* priorizar suite Jest (backend) y Playwright/RTL (frontend) en el próximo sprint.
- **Doble fuente de verdad (SQL script vs Prisma migrate):** mantener ambos sincronizados puede ser costoso. *Mitigación:* migrar semillas y constraints críticos a migraciones Prisma tan pronto se valide el esquema definitivo.
- **Gestión de roles limitada:** hoy solo admin/superadmin pueden mutar, sin interfaz para promover usuarios. *Mitigación:* diseñar módulo `roles` con endpoints seguros y UI para asignación.
- **Monitoreo inexistente:** no hay métricas, por lo que fallos pueden pasar desapercibidos. *Mitigación:* integrar healthchecks en dashboards y considerar `docker logs` centralizados.

### 8.3 Métricas y KPIs sugeridos
- **Tiempo de alta de producto:** del formulario a disponibilidad en POS (meta < 10 segundos). Se puede medir midiendo latencia combinada producto + inventario.
- **Exactitud de inventario:** comparar stock registrado vs físico tras cada jornada; triggers ya previenen negativos.
- **Disponibilidad API:** porcentaje de uptime medido via `GET /health` (meta 99% en horario laboral).
- **Cobertura de pruebas:** objetivo inicial 40% statements backend, 30% frontend.

---

## 9. Recursos útiles
- Documentación NestJS: <https://docs.nestjs.com/>
- Prisma ORM: <https://www.prisma.io/docs>
- Next.js App Router: <https://nextjs.org/docs/app>
- Docker Compose: <https://docs.docker.com/compose/>

---

## 10. Anexos

### 10.1 Resumen de endpoints expuestos

| Módulo        | Método | Ruta                           | Autenticación | Roles requeridos | Notas |
|---------------|--------|--------------------------------|---------------|------------------|-------|
| Auth          | POST   | `/api/auth/register`           | No            | N/A              | Crea usuario, asigna rol por defecto (usuario/admin según flujo). |
| Auth          | POST   | `/api/auth/login`              | No            | N/A              | Devuelve JWT + perfil básico. |
| Auth          | GET    | `/api/auth/me`                 | JWT           | N/A              | Perfil según token. |
| Users         | GET    | `/api/users/me`                | JWT           | N/A              | Perfil enriquecido. |
| Users         | PUT    | `/api/users/:id`               | JWT           | Propietario      | Permite cambiar nombre, teléfono, password. |
| Users         | DELETE | `/api/users/:id`               | JWT           | Propietario      | Elimina cuenta propia. |
| Products      | GET    | `/api/products`                | Opcional      | N/A              | Filtros `search`, `status`. |
| Products      | GET    | `/api/products/:id`            | Opcional      | N/A              | Lanza 404 si no existe. |
| Products      | POST   | `/api/products`                | JWT           | `admin`, `superadmin` | Crea producto; acepta `id_categoria`, `estado`. |
| Products      | PATCH  | `/api/products/:id`            | JWT           | `admin`, `superadmin` | Actualiza campos parciales. |
| Products      | DELETE | `/api/products/:id`            | JWT           | `admin`, `superadmin` | Verifica existencia antes de borrar. |
| Inventory     | GET    | `/api/inventory`               | JWT opcional  | N/A              | Filtros `id_negocio`, `id_producto`, `limit`, `offset`. |
| Inventory     | GET    | `/api/inventory/:id`           | JWT           | `admin`, `superadmin` | Detalle específico. |
| Inventory     | POST   | `/api/inventory`               | JWT           | `admin`, `superadmin` | Crea stock; requiere FKs válidas. |
| Inventory     | PATCH  | `/api/inventory/:id`           | JWT           | `admin`, `superadmin` | Maneja errores P2003/P2025. |
| Inventory     | DELETE | `/api/inventory/:id`           | JWT           | `admin`, `superadmin` | Responde `{ deleted: true }`. |
| Categories    | GET    | `/api/categories`              | Opcional      | N/A              | Listado ordenado por `id_categoria`. |
| Categories    | GET    | `/api/categories/:id`          | Opcional      | N/A              | IDs en `BigInt`; respuesta 404 si no existe. |
| Categories    | POST   | `/api/categories`              | JWT           | `admin`, `superadmin` | Trim de nombre, `P2002` si duplicado. |
| Categories    | PATCH  | `/api/categories/:id`          | JWT           | `admin`, `superadmin` | Actualiza parcial. |
| Categories    | DELETE | `/api/categories/:id`          | JWT           | `admin`, `superadmin` | Elimina, con captura `P2025`. |

### 10.2 Modelado de datos clave

- `producto`: `id_producto BigInt` (PK), `id_categoria BigInt?`, `nombre`, `precio Decimal(12,2)`, `estado ('activo'|'inactivo'|null)`.
- `inventario`: `id_inventario BigInt`, `id_negocio BigInt?`, `id_producto BigInt?`, `cantidad_actual Int`, `stock_minimo Int`, `fecha_actualizacion timestamptz`.
- `categoria`: `id_categoria BigInt`, `nombre VarChar(120)` único.
- `usuarios`: incluye `correo_electronico` único, `password_hash`, `id_rol` (FK a `roles`).
- `roles`: `id_rol BigInt`, `nombre_rol VarChar(50)` único.

> Ver `Backend/prisma/schema.prisma` para atributos adicionales (comentarios, ventas, cortes de caja, etc.), listos para futuras funcionalidades.

---

¿Falta algo o quieres profundizar en otro módulo? Abre un issue o extiende este documento siguiendo la estructura existente.
