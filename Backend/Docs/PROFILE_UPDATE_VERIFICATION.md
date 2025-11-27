## Verificación por correo para actualización de perfil

Se añadió un flujo de verificación para cambios en el perfil del usuario. Ahora, cuando el usuario intenta modificar cualquier dato de su perfil (nombre, teléfono, correo, contraseña, avatar, credencial, número de cuenta, edad), en lugar de aplicar los cambios inmediatamente, el backend creará una sesión de verificación con un código numérico (6 dígitos) y enviará ese código al correo electrónico correspondiente.

Endpoints:
- `PUT /api/users/:id` — Solicita una verificación para los cambios. Recibe el mismo `UpdateUserDto` que antes. Devuelve: `{ message, delivery, expiresAt, session }`.
- `POST /api/users/confirm-update` — Confirma la actualización del perfil. Recibe `{ session, code }` (mismo formato que `VerifyRegisterDto`). Si es correcto, aplica los cambios y devuelve el usuario actualizado.

- `POST /api/users/:id/avatar` — Subir un avatar. Envía un FormData con el archivo bajo la clave `file`. Requiere autenticación y ser propietario del perfil. No requiere verificación por correo.

Comportamiento importante:
- Si la actualización incluye `email`, el código se enviará al `email` nuevo (siempre se verifica el correo al que se envía el código).
- Cada sesión expira en 10 minutos (coincide con TTL del sistema de verificación existente).
- Para cambios de contraseña, el nuevo password se hashea antes de ser almacenado en la sesión firmada y se aplica ya hash en base de datos (evita almacenar contraseñas en texto claro).
- Si el correo proporcionado ya existe en otro usuario, la solicitud de cambio será rechazada durante la etapa de solicitud (antes de enviar el código).

Cómo probar con curl (ejemplo):

1) Solicitar cambio (aquí cambiamos el nombre):

```bash
curl -X PUT "http://localhost:3000/api/users/1" -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"name": "Nuevo Nombre"}'
```

Respuesta (ejemplo):
```
{
  "message": "Código enviado a correo electrónico. Ingresa el código para confirmar los cambios.",
  "delivery": "email",
  "expiresAt": "2025-11-27T...",
  "session": "<jwt_session>"
}
```

2) Confirmar la actualización con el código recibido por correo:

```bash
curl -X POST "http://localhost:3000/api/users/confirm-update" -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"session":"<jwt_session>", "code": "123456"}'
```

Respuesta (ejemplo): Usuario actualizado en formato `serializeUser`.

Notas:
- Por simplicidad se reutiliza el servicio `EmailVerificationService.sendVerificationCodeEmail` para enviar el código al correo, por lo que el email tiene el mismo diseño que el de registro.
- No es posible modificar `numero_telefono` ni `credentialUrl` por medio del endpoint de perfil o del flujo de verificación; estos campos son de sólo lectura desde el perfil (la credencial se debe subir desde `/verification/credencial`).
- Se conservan las protecciones de permisos: sólo el propietario del perfil puede solicitar y confirmar la actualización.

Recomendación: Actualizar el frontend para que en el flujo de edición de perfil solicite el código después de guardar y para que muestre el formulario de verificación con `session` y `code`.
