````markdown
# API Categorías

Guía rápida para consumir el módulo de categorías desde el frontend.

- **Base URL (dev):** `http://localhost:3000/api/categories`
- **Auth:**
  - `GET /` y `GET /:id` son públicos por ahora.
  - `POST /`, `PATCH /:id` y `DELETE /:id` requieren JWT válido con rol `admin` o `superadmin`.
- **Modelo:**
  ```json
  {
    "id_categoria": 0,
    "nombre": "string"
  }
  ```

## Endpoints

### Listar categorías
- `GET /`
- **Respuesta 200**
  ```json
  [
    { "id_categoria": 1, "nombre": "Bebidas" },
    { "id_categoria": 2, "nombre": "Alimentos" }
  ]
  ```

### Obtener categoría
- `GET /:id`
- **Respuesta 200**
  ```json
  { "id_categoria": 1, "nombre": "Bebidas" }
  ```
- **Errores**
  - `404 Not Found` → `{ "message": "Categoría no encontrada" }`

### Crear categoría
- `POST /`
- **Body**
  ```json
  { "nombre": "Snacks" }
  ```
- **Respuesta 201**
  ```json
  { "id_categoria": 6, "nombre": "Snacks" }
  ```
- **Errores**
  - `400 Bad Request`
    - Validación (`nombre` requerido, longitud ≤ 120, string)
    - Duplicado (`El nombre de categoría ya existe`)
  - `401 Unauthorized` si falta/expira el token
  - `403 Forbidden` si el rol no está autorizado

### Actualizar categoría
- `PATCH /:id`
- **Body (parcial)**
  ```json
  { "nombre": "Snacks Premium" }
  ```
- **Respuesta 200**: objeto actualizado.
- **Errores**
  - `400 Bad Request` → validación o nombre duplicado
  - `404 Not Found` si el ID no existe
  - `401/403` mismos casos que `POST`

### Eliminar categoría
- `DELETE /:id`
- **Respuesta 200**
  ```json
  { "deleted": true }
  ```
- **Errores**
  - `404 Not Found` si el ID no existe
  - `401/403` mismo criterio que `POST`

## Notas de implementación frontend
- El backend recorta espacios (`trim`) antes de guardar/actualizar nombres.
- La base de datos aplica un índice único sobre `nombre`; manejar el mensaje de error para UX.
- IDs son `number` (PostgreSQL `bigint`). Serializar como `string` si se envían a componentes que esperan UUID.
- Sugerido cache ligero en frontend (Zustand) porque el catálogo es corto y cambia poco.
- Para pruebas manuales con PowerShell:
  ```powershell
  $token = (Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -Body '{"correo_electronico":"admin@demo.test","password":"Passw0rd!"}' -ContentType 'application/json').token
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/categories -Headers @{Authorization = "Bearer $token"; 'Content-Type'='application/json'} -Body '{"nombre":"Snacks"}'
  ```
````