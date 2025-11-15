````markdown
# API Categorías

Guía para integrar el nuevo flujo de categorías multi-negocio.

- **Base URL (dev):** `http://localhost:3000/api/categories`
- **Auth:** todos los endpoints requieren JWT con roles `admin`, `superadmin`, `empleado` o `usuario` válido y pertenencia al negocio solicitado (`usuarios_negocio`).
- **Modelo base (respuesta)**
  ```json
  {
    "id_categoria": 12,
    "nombre": "Bebidas",
    "negocio_id": 4
  }
  ```
  - Las categorías globales retornan `"negocio_id": null`.

## Endpoints

### Listar categorías
- `GET /`
- **Parámetros**
  - `id_negocio` (query, obligatorio): identificador del negocio activo.
- **Respuesta 200**
  ```json
  [
    { "id_categoria": 1, "nombre": "Bebidas", "negocio_id": null },
    { "id_categoria": 7, "nombre": "Especialidades", "negocio_id": 4 }
  ]
  ```
- **Notas**: la respuesta incluye categorías globales y las del negocio, ordenadas con globales primero.

### Obtener categoría
- `GET /:id`
- **Respuesta 200**
  ```json
  { "id_categoria": 7, "nombre": "Especialidades", "negocio_id": 4 }
  ```
- **Errores**
  - `404 Not Found`: no existe o no pertenece al negocio del usuario.

### Crear categoría
- `POST /`
- **Body**
  ```json
  {
    "nombre": "Snacks",
    "negocioId": "4"
  }
  ```
- **Respuesta 201**: objeto creado con IDs numéricos serializados como número.
- **Errores**
  - `400 Bad Request`: negocio faltante, nombre vacío o duplicado dentro del mismo negocio.
  - `403 Forbidden`: el usuario no pertenece al negocio indicado o intenta crear una global.

### Actualizar categoría
- `PATCH /:id`
- Sólo se permite renombrar categorías del negocio. Las globales son de solo lectura.
- **Body (parcial)**
  ```json
  { "nombre": "Snacks Premium" }
  ```
- **Errores**
  - `403 Forbidden`: intento de modificar una global.
  - `400 Bad Request`: nombre duplicado.
  - `404 Not Found`: categoría inexistente.

### Eliminar categoría
- `DELETE /:id`
- No se pueden eliminar categorías globales.
- **Respuesta 200**
  ```json
  { "deleted": true }
  ```
- **Errores**
  - `403 Forbidden`: categoría global o negocio ajeno.
  - `404 Not Found`: recurso inexistente.

## Consideraciones frontend
- El store `useCategoriesStore` persiste categorías y marca cada registro con `scope: 'global' | 'business'`.
- En la UI, deshabilitar acciones de edición/borrado cuando `scope === 'global'`.
- Si falta `id_negocio`, el backend devuelve `400`. Mostrar mensaje que solicite seleccionar negocio.
- Manejar mensajes textuales del backend (`El nombre de categoría ya existe`) para UX consistente.
- Ejemplo PowerShell:
  ```powershell
  $token = (Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/auth/login -Body '{"correo_electronico":"admin@demo.test","password":"Passw0rd!"}' -ContentType 'application/json').token
  Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/categories?id_negocio=4" -Headers @{Authorization = "Bearer $token"}
  ```
````