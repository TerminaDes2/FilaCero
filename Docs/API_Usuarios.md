# API Usuarios

Guía actualizada del módulo `users`, posterior a la refactorización que añade número de cuenta estudiantil y edad. Todos los endpoints requieren autenticación JWT y responden con claves en camelCase.

Base URL (desarrollo): `http://localhost:3000/api/users`

## Modelo de respuesta `UserProfile`
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phoneNumber": "string | null",
  "roleId": "string | null",
  "accountNumber": "string | null",
  "age": "number | null",
  "avatarUrl": "string | null",
  "credentialUrl": "string | null",
  "verified": true,
  "verifiedAt": "ISODate | null"
}
```

### Campos destacados
- `accountNumber`: número de cuenta del estudiante (5-20 dígitos). Único por usuario.
- `age`: edad declarada (rango permitido 16-120). Cuando no se suministra se devuelve `null`.
- `verified` / `verifiedAt`: estado del flujo de verificación por correo.

## Autenticación y guards
- Todos los endpoints están protegidos con `AuthGuard('jwt')`.
- Los servicios validan que el `id` en ruta coincida con `req.user.id_usuario` antes de actualizar o eliminar.

## GET `/api/users/me`
Obtiene el perfil del usuario autenticado.

Respuesta 200 ejemplo:
```json
{
  "id": "20",
  "name": "Test Refactor",
  "email": "refactor+3@example.com",
  "phoneNumber": "5551234567",
  "roleId": "4",
  "accountNumber": "20251234",
  "age": 21,
  "avatarUrl": "https://example.com/avatar.png",
  "credentialUrl": null,
  "verified": true,
  "verifiedAt": "2025-10-14T15:30:00.000Z"
}
```

Errores:
- 401 `{"message":"Token inválido."}` si el guard no puede determinar el usuario.

## PUT `/api/users/:id`
Actualiza el perfil del usuario autenticado.

Body JSON (campos opcionales):
```json
{
  "name": "Nuevo Nombre",
  "phoneNumber": "5550009999",
  "avatarUrl": "https://...",
  "credentialUrl": "https://...",
  "accountNumber": "20251234",
  "age": 22,
  "newPassword": "Secret123"
}
```

Validaciones relevantes:
- `accountNumber`: 5-20 dígitos (se recorta espacios). Si se envía cadena vacía se almacena `null`.
- `age`: entero entre 16 y 120. Valores `null/undefined` eliminan la edad almacenada.
- `newPassword`: ≥ 6 caracteres, se hashea con bcrypt.

Respuesta 200: `UserProfile` actualizado.

Errores:
- 401 si el `id` de ruta no coincide con el token (`{"message":"No tienes permiso para modificar este perfil."}`).
- 404 si el usuario no existe (`{"message":"Usuario no encontrado."}`).
- 409 (`ConflictException`) cuando `email` o `accountNumber` ya pertenecen a otro usuario (`{"message":"El correo o número de cuenta ya pertenece a otro usuario."}`).

## DELETE `/api/users/:id`
Elimina la cuenta del usuario autenticado.

Respuesta 200:
```json
{ "message": "Cuenta eliminada exitosamente" }
```

Errores:
- 401 si el `id` de ruta es distinto al del token.
- 404 si el registro ya no existe (`{"message":"Usuario no encontrado para eliminar."}`).

## Manejo de errores del servicio `UsersService`
- Serialización uniforme via `serializeUser` devuelve propiedades en camelCase y convierte `bigint/Date`.
- Atrapa errores `PrismaClientKnownRequestError`:
  - `P2025`: se traduce a `NotFoundException`.
  - `P2002`: conflicto por `correo_electronico` o `numero_cuenta` duplicados.
- Los campos string se normalizan (`trim`) y se persisten como `null` cuando se envían vacíos (teléfono, accountNumber).

## Pruebas automáticas
- `src/users/users.controller.spec.ts` verifica flujos de autorización y respuestas para `GET /me`, `PUT /:id`, `DELETE /:id` utilizando `supertest` con un guard de prueba.

## Próximos pasos sugeridos
- Añadir pruebas de integración con base de datos para validar conflictos reales de `numero_cuenta`.
- Implementar guardas adicionales (`VerifiedUserGuard`) antes de exponer operaciones sensibles a usuarios no verificados.
- Extender la documentación con casos de uso de búsqueda por `accountNumber` si se habilita en futuros endpoints.
