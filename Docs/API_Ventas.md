````markdown
# API Ventas

Base URL (dev): `http://localhost:3000/api/sales`

## Autenticación
Todas las rutas requieren JWT válido con roles `superadmin`, `admin`, `empleado` o `usuario`.
Para crear ventas (`POST /api/sales`) la cuenta debe estar verificada; usuarios sin verificación recibirán `403`.

## Crear venta
`POST /api/sales`

Body ejemplo:
```json
{
  "id_negocio": "1",
  "id_tipo_pago": "2",
  "cerrar": true,
  "items": [
    { "id_producto": "10", "cantidad": 2 },
    { "id_producto": "11", "cantidad": 1, "precio_unitario": 55.5 }
  ]
}
```

Notas:
- `items` es obligatorio y debe contener al menos un producto.
- Si `cerrar` se omite, la venta se cierra automáticamente (`estado = pagada`).
- Se valida que exista inventario suficiente para cada producto en el negocio indicado.
- El precio unitario se toma del producto salvo que se especifique.
- Respuesta incluye encabezado y detalle (`detalle_venta`).
- Usuarios no verificados recibirán `403 Forbidden` con mensaje _"La cuenta debe estar verificada para completar esta acción"_.

## Listar ventas
`GET /api/sales`

Query params opcionales:
- `id_negocio`
- `id_usuario`
- `estado` (`abierta`, `pagada`, `cancelada`, `devuelta`)
- `desde` y `hasta` (ISO date) para filtrar por `fecha_venta`.

## Obtener venta
`GET /api/sales/:id`
Devuelve encabezado + detalle con datos de producto y forma de pago.

## Cerrar venta
`PATCH /api/sales/:id/close`

Body opcional:
```json
{ "id_tipo_pago": "2" }
```

Restricciones:
- La venta debe estar `abierta` y tener al menos un detalle cargado.
- Al cerrar, se setean `estado = pagada` y `fecha_venta = now()`.

## Cancelar venta
`PATCH /api/sales/:id/cancel`

- Restaura inventario eliminando los detalles.
- Marca la venta como `cancelada` y deja `fecha_venta` en `null`.

## Consideraciones adicionales
- Los triggers definidos en `Docker/db/db_filacero.sql` mantienen actualizados el stock (`inventario`) y el total de la venta.
- El historial de movimientos se registra automáticamente en `movimientos_inventario`.
- Cualquier intento de vender sin inventario suficiente o con productos inactivos devuelve `400 Bad Request`.
````