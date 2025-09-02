# Arquitectura

## Visión General
FilaCero es un sistema modular dividido en **Frontend (Next.js)** y **Backend (NestJS + PostgreSQL)** orquestados mediante **Docker Compose**. La arquitectura apunta a escalabilidad por módulos (productos, ventas, usuarios, reportes) y separación clara de responsabilidades.

## Componentes
- Frontend: Render, UI, interacción usuario, fetch a API REST.
- Backend: Lógica de negocio, validaciones, persistencia.
- Base de Datos: PostgreSQL (contenedor dedicado).
- Red interna Docker: `filacero-net` para comunicación segura entre servicios.

## Diagrama (texto)
```
[ Navegador ]
      |
      v
[ Frontend Next.js ] --(HTTP REST)--> [ Backend NestJS ] --(TypeORM)--> [ PostgreSQL ]
```

## Flujo de Solicitud (Ejemplo Listar Productos)
1. Usuario abre vista de productos.
2. Frontend solicita `GET /api/products` al backend.
3. Backend consulta repositorio TypeORM (`ProductRepository`).
4. Devuelve JSON ordenado por `createdAt DESC`.
5. Frontend renderiza tabla.

## Decisiones Clave
| Área           | Decisión | Racional |
|----------------|----------|----------|
| Framework API  | NestJS   | Modularidad, inyección dependencias, DX |
| ORM            | TypeORM  | Integración simple con Nest, migraciones |
| DB             | PostgreSQL | Fiabilidad, tipos avanzados |
| Frontend       | Next.js App Router | SSR/ISR, performance |
| Estilos        | Tailwind | Rapidez iteración UI |
| Contenedores   | Docker Compose | Desarrollo consistente |

## Configuración en Contenedores
- Backend expone 3000 (API) y 9229 (debug Node inspector).
- Frontend expone 3001 externo (3000 interno).
- PostgreSQL expone 5432.

## Consideraciones de Escalabilidad
- Extraer servicios críticos a microservicios sólo si la carga lo justifica.
- Añadir caché (Redis) para productos y ventas agregadas.
- Balanceador / reverse proxy (Nginx / Traefik) para TLS y enrutamiento.

## Observabilidad (Futuro)
- Logging estructurado (pino / winston) + correlación de request IDs.
- Métricas Prometheus + dashboard Grafana.
- Trazas distribuidas (OpenTelemetry) si se añaden más servicios.

## Seguridad
- Desactivar `synchronize` en prod + migraciones consistentes.
- Sanitización de entrada y validación DTO.
- CORS restringido (configurar en Nest según dominios permitidos).
- Variables de entorno gestionadas vía `.env` y secretos separados.

## Roadmap Técnicamente Prioritario
1. Migraciones TypeORM.
2. Autenticación (JWT) y roles.
3. Pruebas unitarias + e2e (CI pipeline).
4. Logging estructurado.
5. Monitoreo básico.

## Riesgos Actuales
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| synchronize=true en prod | Pérdida integridad | Implementar migraciones |
| Falta de auth | Acceso no autorizado | Añadir módulo Auth | 
| Sin pruebas | Regresiones | Crear suite mínima |
