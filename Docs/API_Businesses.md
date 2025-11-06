# API Negocios

Documentación de los endpoints disponibles para administrar y consumir la información de negocios en FilaCero.

---

## Base URL
- Desarrollo local: `http://localhost:3000/api/businesses`
- El frontend (`app/api/stores/route.ts`) consume esta API mediante la variable `NEXT_PUBLIC_API_BASE`.

---

## Autenticación
- `GET /api/businesses` es público.
- El resto de endpoints requiere JWT válido y pertenencia al negocio (`usuarios_negocio`).

---

## Endpoints

### 1. Listado público de negocios
- **Ruta:** `GET /api/businesses`
- **Query params opcionales:**
  - `search`: filtro por coincidencia parcial del nombre (`ILIKE`).
  - `limit`: máximo de registros (por defecto 20, máximo 50).
- **Respuesta 200**
```json
[
  {
    "id_negocio": 4,
    "nombre": "Cafetería Central",
    "descripcion": "Av. Principal 123, Col. Centro",
    "telefono": "+52 55 5555 5555",
    "correo": "contacto@central.test",
    "logo": "https://cdn.filacero.dev/logos/central.png",
    "hero_image_url": "https://cdn.filacero.dev/heroes/central.jpg",
    "estrellas": 4.7,
    "categorias": ["Bebidas", "Panadería"]
  }
]
```
- **Notas:**
  - `estrellas` es el promedio de `negocio_rating.estrellas` redondeado a un decimal.
  - `categorias` lista categorías asociadas a productos con inventario disponible.

### 2. Crear negocio
- **Ruta:** `POST /api/businesses`
- **Headers:** `Authorization: Bearer <token>`
- **Body**
```json
{
  "nombre": "Cafetería Central",
  "direccion": "Av. Principal 123",
  "telefono": "+52 55 5555 5555",
  "correo": "contacto@central.test",
  "logo_url": "https://cdn.filacero.dev/logos/central.png",
  "hero_image_url": "https://cdn.filacero.dev/heroes/central.jpg"
}
```
- **Respuesta 201**
```json
{
  "id_negocio": 4,
  "nombre": "Cafetería Central",
  "direccion": "Av. Principal 123",
  "telefono": "+52 55 5555 5555",
  "correo": "contacto@central.test",
  "logo_url": "https://cdn.filacero.dev/logos/central.png",
  "hero_image_url": "https://cdn.filacero.dev/heroes/central.jpg",
  "fecha_registro": "2025-10-22T15:42:01.000Z"
}
```
- **Errores comunes:** `400` (validaciones), `401` (JWT ausente), `500` (migraciones faltantes).

### 3. Negocios asignados al usuario
- **Ruta:** `GET /api/businesses/my`
- **Headers:** `Authorization: Bearer <token>`
- **Respuesta 200**
```json
[
  {
    "id_negocio": 4,
    "nombre": "Cafetería Central",
    "direccion": "Av. Principal 123",
    "telefono": "+52 55 5555 5555",
    "correo": "contacto@central.test",
    "logo_url": "https://cdn.filacero.dev/logos/central.png",
    "hero_image_url": "https://cdn.filacero.dev/heroes/central.jpg"
  }
]
```

### 4. Obtener negocio por ID
- **Ruta:** `GET /api/businesses/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Descripción:** Recupera un negocio en particular. Si el negocio no existe se responde con `404`.

---

## Validaciones principales
- `CreateBusinessDto`
  - `nombre`: requerido, mínimo 2 caracteres.
  - `direccion`, `telefono`, `correo`, `logo_url`, `hero_image_url`: opcionales pero validados (longitud, formato email/URL).
- El servicio asigna al creador como propietario (`usuarios_negocio` con rol `owner`).
- Los listados públicos limitan resultados y sólo exponen campos sin datos sensibles de ownership.

---

## Consideraciones de implementación
- El listado público utiliza una consulta agregada (`$queryRaw`) para calcular promedio de ratings y categorías asociadas.
- Los datos se ordenan por nombre y están acotados (`limit`).
- El frontend `StoresSection` formatea la salida, manejando valores nulos y mostrando el rating con una estrella.
- Para futuras mejoras se puede añadir soporte de paginación (`offset`) o filtros por ubicación.

---

## Ejemplo de consumo en frontend
```ts
const response = await fetch('/api/stores?search=central');
const stores = await response.json();
```
La ruta `/api/stores` actúa como proxy en Next.js y reenvía parámetros al backend.

---

## Pruebas sugeridas
- `npm run lint` y `npm run test` en `Backend/` para asegurar integridad tras cambios.
- Probar manualmente `GET /api/businesses` y `GET /api/stores` verificando que devuelvan la misma información.
- Verificar que usuarios sin token no puedan acceder a `POST /api/businesses`, `GET /api/businesses/my` ni `GET /api/businesses/:id`.
