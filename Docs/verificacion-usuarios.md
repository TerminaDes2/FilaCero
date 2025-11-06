# Flujo de verificación de usuarios

## Objetivo
Garantizar que cada cuenta confirme su correo electrónico antes de acceder a funcionalidades sensibles (valoraciones, operaciones de negocio, etc.).

## Campos relevantes (`usuarios`)
- `verification_token`: token único de 128 caracteres almacenado en la tabla.
- `verification_token_expires`: fecha de expiración en `Timestamptz`.
- `verificado`: bandera booleana que indica si la cuenta completó el proceso.
- `fecha_verificacion`: timestamp registrado tras una verificación exitosa.

## Generación del token
1. Durante el registro o solicitud de verificación se crea un token aleatorio (UUID/base62) y se almacena en `verification_token`.
2. Se establece `verification_token_expires` (ej. +24h) para prevenir reuso indefinido.
3. El backend envía un correo con vínculo del tipo `https://frontend/verify?token=...`.

## Validación
- Endpoint de verificación recibe el token, busca coincidencia y valida vigencia.
- Si es válido: marca `verificado = true`, persiste `fecha_verificacion = now()`, limpia token y expiración.
- Si no es válido o caducó: responde error y ofrece reenviar token.

## Uso del estado de verificación
- Endpoints protegidos (p. ej. creación/edición de valoraciones) invocan `ensureVerified(req)` para denegar acceso con `ForbiddenException` si `verificado` es `false`.
- Permite auditar cuándo cada usuario completó el proceso y bloquear operaciones de cuentas comprometidas.

## Recomendaciones
- Generar tokens criptográficamente seguros (`crypto.randomBytes`).
- Revocar tokens antiguos al generar uno nuevo para evitar colisiones.
- Automatizar el borrado de tokens expirados vía job o interceptar en cada verificación.
