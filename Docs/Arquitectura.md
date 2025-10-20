# Arquitectura

## Visión general
FilaCero es una plataforma multi-negocio para administrar ventas, inventario y catálogos. Se compone de un **Frontend Next.js 13 (App Router)** y un **Backend NestJS 10** que persiste sus datos en **PostgreSQL**. Ambos servicios se orquestan con Docker Compose sobre la red interna `filacero-net`. La arquitectura prioriza la separación por dominios (auth, negocios, inventario, catálogo) y una migración gradual de TypeORM a Prisma.

## Componentes principales
- **Frontend (`Frontend/`)**: Rendering híbrido (Server + Client Components), formularios de registro/onboarding y panel POS. Consume REST mediante `fetch`/helpers en `src/lib/api.ts` y adminstra estado puntual con Zustand.
- **Backend (`Backend/`)**: NestJS modular con guardas JWT, DTOs validados y servicios que operan con Prisma Client. Algunos módulos heredados continúan en TypeORM mientras se completa la migración.
- **Base de datos (`postgres`)**: PostgreSQL 15, inicializado con `Docker/db/db_filacero.sql` y sincronizado mediante migraciones Prisma bajo `Backend/prisma/migrations/`.
- **Infraestructura de desarrollo**: `docker-compose.yml` levanta `frontend`, `backend` y `postgres`, configurando variables `DATABASE_URL` y `NEXT_PUBLIC_API_BASE`.

## Diagrama de interacción
```
[ Navegador ]
                  |
                  v
[ Frontend Next.js ] --(HTTPS REST)--> [ Backend NestJS ] --(Prisma/TypeORM)--> [ PostgreSQL ]
```

## Flujos clave
- **Autenticación y Onboarding**:
      1. El usuario se registra (`POST /api/auth/register`).
      2. Confirma correo vía token (`POST /api/auth/verify`).
      3. Completa wizard de negocio (`POST /api/businesses`, `POST /api/inventory/...`).
- **Operación POS**:
      1. El POS obtiene el negocio activo desde `activeBusiness` y carga categorías (`GET /api/categories?id_negocio=...`).
      2. Lista inventario filtrado por negocio (`GET /api/inventory?negocio=...`).
      3. Registra ventas y ajusta inventario mediante triggers de base de datos.

## Persistencia y capas de datos
- **Prisma** es la capa principal para `auth`, `users`, `roles`, `businesses`, `categories`, `inventory`, `sales`. El esquema vive en `Backend/prisma/schema.prisma` con IDs numéricos para entidades legacy (`usuarios`, `negocio`) y UUID para recursos recientes.
- **TypeORM** sólo permanece en módulos heredados (p. ej. entidad `Product`). La meta es reemplazarlo por Prisma, evitando mezclar ambos ORMs en un mismo servicio.
- **Migraciones**: Cada cambio estructural debe registrarse con `npx prisma migrate dev`. El SQL de Docker debe reflejar los cambios para instalaciones limpias.

## Backend en contexto
- **Autenticación**: JWT por `AuthGuard('jwt')`, roles aplicados con `RolesGuard`. Los controladores exponen endpoints bajo `/api/<módulo>`.
- **Negocios**: `/api/businesses` permite al propietario configurar branding, horarios, empleados y enlaza usuarios con negocios mediante `usuarios_negocio`.
- **Categorías**: `/api/categories` ahora distingue categorías globales y por negocio; todas las operaciones validan que el usuario tenga acceso al negocio (`usuarios_negocio`).
- **Inventario**: `/api/inventory` + `/api/movements` administran existencias por negocio/producto y registran movimientos para auditoría.
- **Productos**: `/api/products` mantiene catálogo y se apoya en Prisma para métricas y media.
- **Ventas**: `/api/sales` genera encabezados, líneas y dispara triggers de inventario.
- **Salud**: `/api/health` (ver `health.controller.ts`).

## Frontend en contexto
- **Carpeta `app/`**: rutas App Router. Destacan `app/auth` (login/registro), `app/onboarding` (wizard multi-paso), `app/pos` (terminal de venta), `app/productos` (gestión catálogo) y `app/shop` (catálogo público en progreso).
- **Componentes**: UI en `src/components/`, features desacopladas (auth, onboarding, POS) y stores en `src/state/` (por ejemplo `useCategoriesStore`).
- **Formularios principales**:
      - **Registro** (`app/auth/register`): formulario con validación client-side, oculta campos según tipo de usuario.
      - **Onboarding de negocio** (`BusinessOnboardingWizard`): pasos para datos generales, branding, ubicación y horas; usa `react-hook-form` con persistencia temporal.
      - **Alta de inventario** (`app/pos/inventory`): formularios dinámicos que enlazan productos y stock por negocio.
      - **Gestión de categorías** (`app/productos/categorias`): CRUD con restricciones sobre categorías globales vs negocio.
- **Estado**: Zustand centraliza `activeBusiness`, categorías y configuraciones POS (densidad, acento). Persistencia en `localStorage` para preferencias.

## Endpoints y contratos
- Las rutas siguen el patrón `/api/<recurso>` con respuestas en JSON.
- DTOs se encuentran en cada módulo (`Backend/src/<modulo>/dto/`) y aplican `class-validator`.
- Los documentos detallados por recurso viven en `Docs/API_*.md`; debe consultarse ese material antes de extender la API.

## Seguridad y operaciones
- **Autorización**: todos los endpoints de negocio requieren JWT y validan rol; categorías globales son de solo lectura.
- **CORS**: configurado en backend para dominios de frontend.
- **Observabilidad**: logs básicos con `Logger` de Nest; planificado integrar Pino y métricas.
- **Ports**: backend en `3000`, frontend en `3001` (interno `3000`), PostgreSQL en `5432`, debug backend en `9229`.

## Próximos pasos técnicos
- Consolidar la migración a Prisma para productos y módulos restantes.
- Automatizar migraciones y seeds dentro del pipeline CI.
- Añadir pruebas e2e (POS + inventario multi-negocio) y monitoreo básico.
