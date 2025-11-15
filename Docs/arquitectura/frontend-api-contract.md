# Contrato API — Integraciones pendientes para Frontend

Este documento resume los cambios que el backend introducirá durante la refactorización y cómo deberán consumirse desde el frontend.

## 1. Nuevos Campos en Recursos Existentes

### Usuario (`/api/users/:id`)
- `verified: boolean`
- `verifications: { email: boolean; sms: boolean; credential: boolean }`
- `verificationTimestamps: { email: string | null; sms: string | null; credential: string | null }`
- `avatar_url: string | null`
- `credential_url: string | null`

### Negocio (`/api/businesses/:id`)
- `logo_url: string | null`
- `hero_image_url: string | null`
- `rating_promedio: number | null` (0–5, dos decimales)
- `rating_total: number` (cantidad de votos)

### Producto (`/api/products/:id`)
- `imagen_url: string | null`
- `descripcion_larga: string | null`
- `media: Array<{ id: string; url: string; principal: boolean; tipo: string }>`
- `metricas: Array<{ id_metricas: string; id_negocio: string | null; anio: number; semana: number; cantidad: number; calculado_en: string | null }>`
- `popularity: number` (suma de `cantidad` en la ventana cargada)

## 2. Endpoints Nuevos o Actualizados

### 2.1 Verificación de Usuarios
- `POST /auth/register`
  - Body: `{ "name": string, "email": string, "password": string, "role"?: 'usuario' | 'admin' }`
  - Respuesta:
    ```json
    {
      "token": "<jwt provisional>",
      "user": {
        "id": "123",
        "email": "demo@filacero.com",
        "verified": false,
        "avatarUrl": null,
        "credentialUrl": null
      },
      "requiresVerification": true,
      "verificationToken": "uuid",
      "verificationTokenExpiresAt": "2025-10-14T03:27:00.000Z"
    }
    ```
- `POST /auth/verify`
  - Body: `{ "token": string }`
  - Respuesta:
    ```json
    {
      "message": "Cuenta verificada correctamente.",
      "verifiedAt": "2025-10-13T21:27:00.000Z",
      "token": "<jwt definitivo>",
      "user": {
        "id": "123",
        "email": "demo@filacero.com",
        "verified": true,
        "avatarUrl": null,
        "credentialUrl": null
      }
    }
    ```
- `POST /auth/login`
  - Respuesta contiene el mismo payload `token + user` descrito arriba. Si la cuenta no está verificada, devuelve `401` con mensaje `Cuenta pendiente de verificación.`
- `POST /auth/request-verification` **(pendiente)**
  - Se añadirá para reenviar token por correo cuando se habilite servicio de mailing.
- `POST /api/users/:id/credential` **(pendiente)**
  - Mantener en backlog hasta definir proveedor de almacenamiento.

### 2.2 Ratings de Negocios
- `GET /api/businesses/:id/ratings`
  - Respuesta:
    ```json
    {
      "promedio": 4.2,
      "total": 37,
      "estrellas": {
        "1": 1,
        "2": 3,
        "3": 8,
        "4": 10,
        "5": 15
      }
    }
    ```
- `POST /api/businesses/:id/ratings`
  - Body: `{ "estrellas": 1..5, "comentario"?: string }`
  - Respuesta: `{ "rating": { ... registro creado ... } }`
  - Límite: 1 rating por usuario y negocio (backend devuelve 409 si intenta duplicar).

### 2.3 Métricas de Productos
- `GET /api/reports/popular-products?range=week`
  - Respuesta:
    ```json
    [
      {
        "productoId": "123",
        "nombre": "Latte",
        "cantidad": 84,
        "imagen_url": "https://...",
        "precio": 52.5
      }
    ]
    ```
  - `range` aceptará `week` o `month`.

### 2.4 Media de Productos/Negocios
- `POST /api/products/:id/media`
  - Multipart (`files[]`, admitir múltiples). Campos opcionales: `principal` (boolean), `tipo`.
  - Respuesta: arreglo de assets agregados.
- `DELETE /api/products/:id/media/:mediaId`
  - Elimina asset; responde `{ deleted: true }`.
- Negocios y usuarios seguirán un patrón equivalente (`/api/businesses/:id/media`, `/api/users/:id/avatar`).

## 3. Reglas de Negocio (para UI)
- Usuarios no verificados:
  - Verificar `user.verified` (correo) para habilitar onboarding básico.
  - Consultar `user.verifications.sms` y `user.verifications.credential` para liberar POS y acciones presenciales.
  - Mostrar banner explicando qué canal falta completar.
- Ratings:
  - Mostrar promedio con fracciones (usar dato backend).
  - Evitar permitir múltiples votos; refrescar conteo tras enviar rating.
- Media:
  - Permitir subir imágenes principales + galería.
  - Backend devolverá URLs absolutas; frontend debe manejar carga/progreso y actualizar estado local.

## 4. Estados y Errores esperados
- `401` cuando token JWT falta o es inválido.
- `403` para usuarios sin verificación o sin rol adecuado.
- `409` al intentar duplicar rating o uso de token expirado.
- `422` con detalles de validación (por ejemplo, `estrellas` fuera de rango).

## 5. Próximos Pasos para Frontend
1. Actualizar stores (Zustand) y tipos para reflejar campos nuevos.
2. Crear formularios/flujos:
   - Wizard de verificación (solicitud de email + validación de token + subida de credencial).
   - UI de ratings (promedio, breakdown, formulario).
   - Galería de imágenes en productos y negocios.
3. Añadir vistas para “productos populares de la semana” (utilizar endpoint de reportes).
4. Incluir soporte para multi-upload (usando `FormData`).
5. Adaptar componentes existentes (`NewProductPanel`, `EditProductPanel`, dashboards, etc.).

## 6. Dependencias externas sugeridas
- SDK para uploads (S3/Cloudinary) — el backend devolverá las URLs resultantes.
- Librería de rating UI (o componente propio) que soporte valores fraccionarios.
- Manejo de estados asíncronos (React Query/SWR) para ratings y métricas en tiempo real.

---
**Nota:** Este contrato se actualizará conforme avance la implementación backend. El equipo frontend debe coordinar pruebas en staging una vez publicados los endpoints.
