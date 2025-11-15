# Implementaciones recientes: Valoraciones de negocios

## Alcance
- Servicio `BusinessRatingsService` construido sobre Prisma para manejar valoraciones.
- Controlador `BusinessRatingsController` expone rutas REST bajo `/api/businesses/:businessId/ratings`.
- Módulo `BusinessRatingsModule` registrado en `AppModule` para habilitar inyección de dependencias.

## Endpoints expuestos
- `GET /api/businesses/:businessId/ratings`: pagina valoraciones con metadatos.
- `GET /api/businesses/:businessId/ratings/summary`: devuelve promedio y distribución 1-5.
- `POST /api/businesses/:businessId/ratings`: crea o actualiza valoración del usuario autenticado.
- `POST /api/businesses/:businessId/ratings/:ratingId`: actualiza una valoración existente (propietario o rol privilegiado).
- `DELETE /api/businesses/:businessId/ratings/:ratingId`: elimina la valoración (propietario o rol privilegiado).

## Comportamiento clave
- Conversión de identificadores numéricos a `bigint` con validación y errores `BadRequestException`.
- Normalización de comentarios (trim, conversión a `null` para cadenas vacías).
- Protección contra edición/eliminación no autorizada (`ForbiddenException`).
- Transacciones Prisma para obtener listados y métricas.
- Respuesta serializada con información básica del usuario (`id`, `nombre`, `avatarUrl`).
