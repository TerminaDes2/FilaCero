# Productos por Negocio y Operaciones Globales (Admin)

Este documento describe los cambios introducidos para permitir la configuración por negocio de productos (precio, estado) y las operaciones globales que puede ejecutar un administrador sobre todos sus negocios.

## Nuevos modelos Prisma
- `negocio_producto`: tabla que contiene el precio del producto según el negocio, estado (activo/inactivo) y relación con `producto` y `negocio`.
- `negocio_producto_historial_precio`: historial de cambios por negocio para un producto (precio por negocio con registro de usuario y motivo).

## Comportamiento principal
- Cada negocio puede tener su propio precio (`negocio_producto.precio`) y un flag `activo` para habilitar/deshabilitar el producto en un negocio.
- Las ventas usa el precio por negocio cuando existe override, y bloquearán ventas si `activo === false` para ese negocio.
- El administrador (dueño del negocio) puede crear/gestionar productos para un negocio específico y también aplicar acciones globales sobre todos sus negocios.

## Endpoints importantes (nuevos/alterados)
- POST `/api/businesses/:id/products` (roles: admin, superadmin, empleado): asociar un `producto` a un `negocio` con `precio` y `initial_stock` opcionales.
- PUT `/api/businesses/:id/products/:productId/price` (roles: admin, superadmin, empleado): actualizar precio para un producto en un negocio específico y registrar su historial.
- GET `/api/businesses/:id/products/:productId/price/history` (roles: admin, superadmin, empleado, usuario): historial de precio por negocio.
- POST `/api/products/apply/global` (roles: admin, superadmin): aplicar una acción global a todos los negocios del administrador. Body: `{ action: 'add'|'deactivate'|'update_price', id_producto, precio?, initial_stock?, motivo? }`.

## Cambios en endpoints existentes
- GET `/api/products` con query `id_negocio` ahora aplicará:
  - Si existe `negocio_producto` para ese `id_negocio` y `id_producto`, se usará `negocio_producto.precio`.
  - Si la relación existe y `activo === false`, el producto queda oculto para ese negocio.
- Las ventas (POST `/api/sales`) usan el precio por negocio si existe, y bloquean venta si el producto está desactivado para el negocio.

## Pasos para actualizar la base de datos
1. Actualizar `schema.prisma` con los nuevos modelos (ya hecho).
2. Generar migración y aplicarla en el entorno (o ejecutar migraciones dentro del contenedor de backend):

```powershell
cd Backend
npx prisma migrate dev --name negocio_producto
npx prisma generate
```

> Nota: Asegúrate de estar apuntando a `DATABASE_URL` correcto.

## Notas de compatibilidad
- La tabla `producto` continúa existiendo y actúa como línea base (precio global). `negocio_producto` solo aplica overrides por negocio.
- Si un producto no tiene registro en `negocio_producto` para un negocio específico, se utiliza el `producto.precio` global.
- Se agregaron validaciones para permisos: solo `owner` o cliente asignado (empleado) puede modificar un `negocio` o sus productos.

## Siguientes pasos sugeridos
- Implementar un endpoint para listar productos por negocio que devuelva de forma nativa el precio por negocio (hoy `GET /api/products?id_negocio` devuelve esa info con `id_negocio`).
- Mover selectores comunes de validación y permisos a utilidades compartidas.
- Añadir pruebas e2e que cubran: aplicar change global, venta con override, desactivar producto por negocio.
- Actualizar front-end (Next.js) para usar el nuevo parámetro `id_negocio` y soportar precios por negocio y acciones globales para admins.

---
Document created automatically by Copilot change set. Please review security and business logic with product owners and apply additional role validations as required.
