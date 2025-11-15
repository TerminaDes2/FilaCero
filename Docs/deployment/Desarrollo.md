# Guía de Desarrollo

## Requisitos Previos
- Node.js 18+
- Docker + Docker Compose
- npm

## Puesta en Marcha (Local con Docker)
1. Clonar repositorio.
2. Crear archivo `Backend/.env` basado en `.env.example` (opcional si se usa compose con variables inline).
3. Ejecutar:
   - `docker compose up --build` (o desde VS Code tareas definidas)
4. Accesos:
   - API: http://localhost:3000/api
   - Frontend: http://localhost:3001
   - DB: localhost:5432 (user/password configurados)

## Desarrollo Rápido (Hot Reload)
- Backend: volumen `./Backend/src` montado, usar script `start:dev` dentro del contenedor (ajustar Dockerfile si necesario).
- Frontend: comando `npm run dev` ya configurado en compose.

## Debugging
- Backend expone 9229: adjuntar debugger Node en VS Code.
- Frontend (compose.debug.yaml) permite inspección con `--inspect`.

## Estándares de Código
- DTOs con validación (`class-validator`).
- Nombrado archivos: `feature.type.ts` (ej. `product.service.ts`).
- Evitar lógica compleja en controladores → delegar a servicios.

## Añadir Un Nuevo Módulo (Backend)
1. `nest g resource sales` (o manual).
2. Crear entidad y DTOs.
3. Registrar módulo en `app.module.ts` (o usar auto-registration si se mantiene estructura).
4. Añadir pruebas unitarias.

## Migraciones (Pendiente Implementar)
Config a añadir:
```
npx typeorm migration:generate -d src/migrations -n CreateProducts
npx typeorm migration:run
```
Se requiere actualizar config TypeORM a un archivo separado y desactivar `synchronize`.

## Testing (Sugerido)
Instalar jest (Nest ya integra tooling):
```
npm i -D jest @types/jest ts-jest
```
Crear pruebas en `Backend/test/` y e2e para endpoints críticos.

## Formato y Lint (Pendiente)
- Añadir ESLint + Prettier para ambos proyectos
- Hooks pre-commit (Husky) para validar

## Commits
Usar convención simple (feat, fix, docs, chore, refactor).
Ejemplo: `feat(products): agrega endpoint de búsqueda`.

## Roadmap Corto
- Autenticación JWT
- Migraciones
- UI tabla productos
- Pruebas básicas

## Seguridad Local
- No commitear `.env`
- Revisar dependencias vulnerables (`npm audit`)

## Deploy Futuro
1. Build imágenes.
2. Push a registry.
3. Aplicar migraciones.
4. Levantar stack en servidor (docker compose -p filacero up -d).

