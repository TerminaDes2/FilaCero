# Infraestructura

## Contenedores (docker-compose.yml)
Servicios actuales:

| Servicio  | Imagen / Build                       | Puertos           | Depende de |
|-----------|--------------------------------------|-------------------|------------|
| backend   | Docker/backend.Dockerfile            | 3000, 9229        | postgres   |
| frontend  | Docker/frontend.Dockerfile           | 3001->3000 interno| backend    |
| postgres  | postgres:13                          | 5432              | -          |

Red: `filacero-net` (default) para comunicación interna.

## Volúmenes
| Volumen         | Montaje                                      | Propósito                |
|-----------------|----------------------------------------------|--------------------------|
| ./Backend/src   | /app/src                                     | Hot reload backend       |
| ./Backend/public| /app/public                                  | Archivos estáticos       |
| ./Frontend      | /app                                         | Hot reload frontend      |
| postgres_data   | /var/lib/postgresql/data (anónimo nombrado)  | Persistencia DB          |

## Variables de Entorno Clave
Backend:
- PORT=3000
- DATABASE_URL=postgres://user:password@postgres:5432/filacero

Frontend:
- NEXT_PUBLIC_API_BASE=http://localhost:3000/api
- NODE_ENV=development

Postgres:
- POSTGRES_DB=filacero
- POSTGRES_USER=user
- POSTGRES_PASSWORD=password

## Dockerfiles
- `Docker/backend.Dockerfile`: Construye imagen de Nest (no mostrado aquí, revisar archivo para optimizar multistage).
- `Docker/frontend.Dockerfile`: Construye imagen Next.js.

## Modo Debug
`compose.debug.yaml` define servicio `filacerofrontend` con puerto 9229 para inspección Node (frontend). Para backend se expone también 9229 en compose principal.