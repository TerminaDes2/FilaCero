---
title: Documentación Técnica de FilaCero
description: Arquitectura, instalación, uso, despliegue y mantenimiento.
---

# FilaCero – Documentación Técnica

## 1. Visión general
FilaCero es una plataforma (monorepo ligero) compuesta por:
* Backend: API REST con NestJS + Mongoose (MongoDB)
* Frontend: Vite + Tailwind (SPA inicial simple)
* Base de datos: MongoDB 7
* Infra local: Docker Compose

Rutas clave:
```
Backend/   Código NestJS (src, schemas, seeds)
Frontend/  Código cliente Vite
Docker/    Dockerfiles backend/frontend
docker-compose.yml  Orquestación local completa
```

## 2. Arquitectura resumida
```
[Frontend SPA] --fetch--> /api/...  (Backend Nest)
                               |
                           MongoDB
```
El backend expone `/api/health` y CRUD de `Example` en `/api/examples` como base para extender.

## 3. Requisitos previos
Opción A (recomendada): Sólo Docker Desktop (>= 4.x) o Docker Engine + Compose plugin.

Opción B (desarrollo sin contenedores):
* Node.js 20 LTS
* MongoDB local (o Atlas) 

## 4. Variables de entorno
Archivo `Backend/.env` (ejemplo en `.env.example`):
```
PORT=3000              # Puerto de escucha Nest
MONGO_URI=mongodb://mongo:27017/filacero  # Cadena conexión (service name mongo en compose)
```
Si no se define `MONGO_URI`, el módulo usa `mongodb://mongo:27017/filacero` por defecto.

## 5. Levantar entorno local (Docker)
```powershell
docker compose up --build
```
Servicios expuestos:
* Backend: http://localhost:3000/api/health
* Frontend: http://localhost:5173/
* MongoDB: mongodb://localhost:27017/filacero

Logs en vivo:
```powershell
docker compose logs -f backend
docker compose logs -f frontend
```

Reconstruir sólo una imagen:
```powershell
docker compose build backend
```

Entrar al contenedor backend:
```powershell
docker compose exec backend sh
```

## 6. Desarrollo sin Docker (alternativo)
Backend:
```powershell
cd Backend
npm install
set MONGO_URI=mongodb://localhost:27017/filacero; npm run start:dev
```
Frontend:
```powershell
cd Frontend
npm install
npm run dev
```

## 7. Scripts disponibles
Backend (`Backend/package.json`):
* `start:dev` modo watch (nodemon interno de Nest CLI)
* `start:debug` habilita inspector (puerto 9229 expuesto en Docker)
* `build` compila a `dist/`
* `start:prod` ejecuta `dist/main.js`
* `seed` inserta datos de ejemplo (`src/seeds/seed.ts`)

Frontend:
* `dev` servidor de desarrollo Vite (`--host` en Docker para exponer)
* `build` producción a `dist/`
* `preview` servir build estático para test local

## 8. Endpoints actuales
Health:
```
GET /api/health
{
  status: "ok",
  framework: "nest",
  mongo: "connected",
  exampleCount: <n>,
  time: ISOString
}
```
CRUD Example:
```
POST   /api/examples        { name }
GET    /api/examples
GET    /api/examples/:id
PATCH  /api/examples/:id    { name? }
DELETE /api/examples/:id
```

## 9. Seeder
Ejecutar dentro del contenedor o local (requiere `MONGO_URI` válido):
```powershell
docker compose exec backend npm run seed
```

## 10. Debugging
Con Docker ya se expone `9229`. Iniciar VS Code (Dev Container o local) y adjuntar a `localhost:9229`.

## 11. Dev Containers (VS Code)
Archivo `.devcontainer/devcontainer.json` permite abrir VS Code directamente dentro del servicio `backend`:
1. Instalar extensión "Dev Containers".
2. Command Palette: "Dev Containers: Reopen in Container".
3. Al abrir, se ejecuta `npm install` y se habilitan extensiones recomendadas.

## 12. Producción (lineamientos iniciales)
Sugerido separar build y runtime:
1. Backend: multistage (build -> runtime slim) y usar `npm ci --omit=dev` en runtime.
2. Frontend: build estático (`npm run build`) servido por nginx o por el backend (Opcional: servir desde un bucket/CDN).
3. MongoDB gestionado (Atlas / servicio administrado) con backup automatizado.
4. Variables secretas vía gestor (Docker secrets / Vault / variables CI/CD).

Ejemplo rápido (conceptual) backend multistage:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json nest-cli.json tsconfig*.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## 13. Seguridad y buenas prácticas pendientes
* Validación global con pipes (class-validator) – base ya instalada
* Configuración de CORS restrictiva
* Rate limiting (por ejemplo @nestjs/throttler)
* Autenticación (JWT u otro) y autorización por roles
* Logs estructurados (pino / winston)
* Tests unitarios e integración (Jest) (no implementados aún)

## 14. Roadmap sugerido
| Tema | Estado | Notas |
|------|--------|-------|
| Variables entorno centralizadas | Parcial | Falta tipado config y validación schema | 
| Tests backend | Pendiente | Añadir Jest + cobertura | 
| ESLint + Prettier | Pendiente | Mantener estilo | 
| Autenticación | Pendiente | JWT + refresh | 
| CI/CD | Pendiente | GitHub Actions build/test | 
| Observabilidad | Pendiente | Health extra + métricas Prometheus | 

## 15. Troubleshooting
Problema: VS Code no encuentra `@nestjs/common`.
Solución: Abrir como Dev Container o instalar dependencias localmente en `Backend/`.

Problema: Mongo no conecta.
* Ver logs: `docker compose logs -f backend`
* Confirmar servicio: `docker compose ps`
* Probar ping interno: `docker compose exec backend sh -c "nc -z mongo 27017 || echo fail"`

Problema: Puerto 3000 ocupado.
* Cambiar `PORT` en `.env` y mapear en `docker-compose.yml`.

## 16. Estándar de contribución (mini guía)
1. Crear rama feature: `feat/nombre-corto`.
2. Commits convencionales: `feat: ...`, `fix: ...`, `docs: ...`.
3. PR pequeña (<400 líneas cambiadas idealmente) con descripción.

---
Fin de documento.
