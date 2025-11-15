<div align="center">
	<h1>FilaCero ☕💻</h1>
	<p><em>POS moderno para cafeterías escolares: rápido, simple y listo para producción.</em></p>

	<!-- Si agregas un logo propio, colócalo en Frontend/public/images/logo.png y descomenta la línea siguiente -->
	<!-- <img src="Frontend/public/images/logo.png" alt="Logo FilaCero" width="120" /> -->

	<a href="https://nextjs.org"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-13-black?logo=next.js" /></a>
	<a href="https://nestjs.com/"><img alt="NestJS" src="https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white" /></a>
	<a href="https://www.postgresql.org/"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-13-336791?logo=postgresql&logoColor=white" /></a>
	<a href="https://www.prisma.io/"><img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" /></a>
	<a href="https://www.docker.com/"><img alt="Docker" src="https://img.shields.io/badge/Docker-ready-0db7ed?logo=docker&logoColor=white" /></a>
</div>

---

## 🔎 ¿Qué es FilaCero?
**FilaCero** es un sistema de **punto de venta (POS)** optimizado para **cafeterías escolares**. Su objetivo es agilizar la operación diaria: ventas, inventario, conteos de caja, pedidos y métricas, ofreciendo una experiencia clara y rápida para personal y estudiantes.

Consulta más detalle funcional en `Docs/`:
- [Resumen de funcionalidades](Docs/funcionalidades-filacero.md)
- [Arquitectura](Docs/Arquitectura.md)
- [Frontend](Docs/Frontend.md) y [contrato API Frontend](Docs/frontend-api-contract.md)
- [Backend](Docs/Backend.md) y [análisis exhaustivo](Docs/backend-comprehensive-analysis.md)

---

## 🚀 Características principales
- Gestión de productos, categorías y precios en tiempo real.
- Módulo de ventas y pedidos con flujo simplificado y estados claros.
- Inventario con movimientos y métricas semanales por producto/negocio.
- Reportes de ventas, cortes de caja y tipos de pago.
- Valoraciones y comentarios de negocio (engagement del alumnado).
- Arquitectura escalable lista para Docker + PostgreSQL + Redis.

---

## 🧱 Arquitectura (monorepo)
- `Backend/` — NestJS con coexistencia transitoria de TypeORM y Prisma (migración activa hacia Prisma). Prefijo de rutas: `/api/<recurso>`.
- `Frontend/` — Next.js 13 (App Router) + Tailwind + Zustand.
- `Docker/` y `docker-compose.yml` — Orquestación de `backend`, `frontend`, `postgres` y `redis` en la red `filacero-net`.

Puertos por defecto (modo contenedor):
- Backend: `http://localhost:3000` → API bajo `http://localhost:3000/api`
- Frontend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## ✅ Requisitos
- Node.js 18+ (desarrollo local) y npm.
- Docker y Docker Compose (recomendado para levantar todo el stack).
- PostgreSQL 13+ y Redis 7 (opcional si no usas Docker).

---

## ⚡ Inicio rápido con Docker (recomendado)
1) Levanta los servicios (backend, frontend, postgres, redis):

```powershell
docker compose up -d
```

2) Genera el cliente Prisma dentro del backend (primera vez o tras cambios en `schema.prisma`):

```powershell
docker exec -it filacero-backend npx prisma generate
```

3) Si es la primera vez, crea la migración inicial (el repo no incluye migraciones aún):

```powershell
docker exec -it filacero-backend npx prisma migrate dev --name init
```

4) (Opcional) Si tienes semilla, ejecútala:

```powershell
docker exec -it filacero-backend npm run db:seed
```

5) Abre la app:
- Frontend: `http://localhost:3001`
- API: `http://localhost:3000/api`

Atajos útiles:
- Reiniciar en limpio (destructivo):

```powershell
docker compose down -v; docker compose up -d
```

---

## 🛠️ Desarrollo local (sin Docker)
Puedes correr cada parte por separado (requiere PostgreSQL y Redis locales):

1) Backend
- Configura `DATABASE_URL` (PostgreSQL) y variables de Redis en tu entorno.
- Instala dependencias y arranca en modo dev:

```powershell
cd Backend
npm install
npm run dev
```

- Endpoints bajo: `http://localhost:3000/api`

2) Frontend
- Configura `NEXT_PUBLIC_API_BASE` apuntando al backend local (`http://localhost:3000/api`).
- Instala dependencias y arranca en modo dev:

```powershell
cd Frontend
npm install
npm run dev
```

- App en: `http://localhost:3000` (si no usas Docker; con Docker es `http://localhost:3001`).

> Consejo: también puedes usar Docker sólo para Postgres/Redis y correr apps localmente.

---

## 🔧 Variables de entorno clave
Backend (`docker-compose.yml`):
- `PORT=3000`
- `DATABASE_URL=postgres://user:password@postgres:5432/filacero`
- `REDIS_HOST=redis`, `REDIS_PORT=6379`
- `REQUEST_BODY_LIMIT=50mb`, `MAX_HTTP_HEADER_SIZE=32768`, `NODE_OPTIONS=--max-http-header-size=32768`

Frontend (`docker-compose.yml`):
- `NEXT_PUBLIC_API_BASE=http://backend:3000/api` (en host: `http://localhost:3000/api`)
- `NEXT_PUBLIC_NEGOCIO_ID=1`

---

## 🗃️ Prisma y datos
- Esquema: `Backend/prisma/schema.prisma` (usa `uuid`/autoincrement según tabla; no requiere extensión `uuid-ossp`).
- Migraciones: carpeta `Backend/prisma/migrations/` (actualmente vacía). Crea la primera con:

```powershell
docker exec -it filacero-backend npx prisma migrate dev --name init
```

- Generar cliente tras modificar `schema.prisma`:

```powershell
docker exec -it filacero-backend npx prisma generate
```

- Script SQL inicial: `Docker/db/db_filacero.sql` (cargado automáticamente al inicializar el volumen de Postgres).

---

## 🧭 Rutas y módulos (API)
Documentación por módulo en `Docs/`:
- [Productos](Docs/API_Productos.md)
- [Categorías](Docs/API_Categorias.md)
- [Usuarios](Docs/API_Usuarios.md)
- [Ventas](Docs/API_Ventas.md)
- [Negocios](Docs/API_Businesses.md)
- [SMS](Docs/API_SMS.md)

---

## 🧩 Estructura del repositorio
```
Backend/        # API NestJS (Prisma + TypeORM en transición)
Frontend/       # Next.js 13 + Tailwind + Zustand
Docker/         # Dockerfiles y SQL inicial
Docs/           # Documentación funcional y técnica
```

---

## 🧪 Debug y calidad
- Node Inspector backend expuesto en `9229` (ver `docker-compose.yml`).
- Lint backend: `cd Backend; npm run lint`
- Tests backend: `cd Backend; npm test`

---

## ❗ Troubleshooting
- Error 431 (cabeceras grandes): ya gestionado con `MAX_HTTP_HEADER_SIZE` y `NODE_OPTIONS` en el backend.
- ¿La API no responde? Verifica `DATABASE_URL` y que Postgres esté arriba.
- ¿El frontend no ve la API? Revisa `NEXT_PUBLIC_API_BASE` según si estás dentro o fuera de Docker.

---

## 🗺️ Roadmap y planes
- [Roadmap de funcionalidades](Docs/roadmap-funcionalidades.md)
- [Plan refactor backend](Docs/backend-refactor-plan.md)
- [Fase 2 pedidos](Docs/SISTEMA_PEDIDOS_FASE2_BACKEND.md) y [plan de implementación](Docs/SISTEMA_PEDIDOS_IMPLEMENTACION.md)

---

## 🤝 Contribuir
- Preferir Prisma para nuevos módulos (ver `Backend/src/prisma/`), evitar mezclar Prisma y TypeORM en el mismo servicio.
- Mantener prefijo de rutas `/api/<recurso>` en controladores.
- Para nuevos esquemas: crear migración Prisma y luego `npx prisma generate`.

---

## 👨‍💻 Equipo de desarrollo
Proyecto desarrollado en la **Universidad de Colima** por:
- Nieves Martínez Christopher Eugenio
- Valdovinos Arias Kevin
- Quiróz Paéz Ricardo
- García Bautista Dominic Isaí
- Rosas Chávez Carlos Leonardo

---

## 🖼️ Branding y animaciones (opcional)
- Coloca tu logo en `Frontend/public/images/logo.png` y descomenta la imagen del encabezado.
- Puedes añadir un GIF corto de la app (ej. flujo de venta) en `Frontend/public/images/demo.gif` y referenciarlo aquí:
	- `![Demo](Frontend/public/images/demo.gif)`

---

## 📄 Licencia
Este proyecto se distribuye bajo licencia MIT (ver `Backend/package.json`).
