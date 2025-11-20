# API Productos

Referencia detallada de la colección de endpoints de productos.

Base URL (desarrollo): `http://localhost:3000/api/products`

## Modelo Product
```json
{
  "id": "uuid",
  "name": "string",
  "price": 0,
  "stock": 0,
  "active": true,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

## Crear Producto
POST `/api/products`

Body JSON:
```json
{
  "name": "Café Latte",
  "price": 30.0,
  "stock": 50,
  "active": true
}
```
Respuesta 201 ejemplo:
```json
{
  "id": "...",
  "name": "Café Latte",
  "price": 30,
  "stock": 50,
  "active": true,
  "createdAt": "2025-09-01T00:00:00.000Z",
  "updatedAt": "2025-09-01T00:00:00.000Z"
}
```
Errores:
- 400 Validación

## Listar Productos
GET `/api/products`
Respuesta 200:
```json
[
  { "id": "...", "name": "Café Latte", "price": 30, "stock": 50, "active": true, "createdAt": "...", "updatedAt": "..." }
]
```

## Obtener Producto
GET `/api/products/:id`
Errores:
- 404 si no existe

## Actualizar Producto
PATCH `/api/products/:id`
Body (campos parciales):
```json
{
  "price": 32.5,
  "stock": 40
}
```
Respuesta 200: objeto actualizado.

## Eliminar Producto
DELETE `/api/products/:id`
Respuesta 200:
```json
{ "deleted": true }
```

## Notas
- No existe paginación aún.
- No hay soft delete: eliminación física.
- `synchronize` (TypeORM) activo: cambios de entidad aplican directamente.

## Próximas Extensiones
- Filtros: activos, rango de precio.
- Paginación y orden dinámico.
- Soft delete (columna `deletedAt`).
- Auditoría (quién creó / editó).
