# API SMS (Twilio Verify)

Base path: `/api/sms`

## Iniciar verificación
POST `/api/sms/verify/start`  (ojo: es "start", no "star")
Body JSON:
```
{ "telefono": "+523141001234", "canal": "sms" }
```
`canal` opcional: `sms` (default) o `call`.
Respuesta:
```
{ "sid": "VE...", "status": "pending", "to": "+523141001234", "channel": "sms" }
```

## Verificar código
POST `/api/sms/verify/check`
Body JSON:
```
{ "telefono": "+523141001234", "codigo": "123456" }
```
Respuesta cuando es correcto:
```
{ "sid": "VE...", "status": "approved", "to": "+523141001234", "verified": true }
```
(El backend marca `usuarios.sms_verificado=true` y setea timestamp.)

Respuesta con error de código:
```
{ "statusCode": 400, "message": "Código inválido o expirado", "error": "Bad Request" }
```

## Variables de entorno requeridas
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`

## Notas
- Teléfonos restringidos a México: siempre +52 seguido de 10 dígitos. Se aceptan formatos locales (10 dígitos) y se auto-prefija +52.
- Ejemplos válidos: `3001112233` -> `+523001112233`, `523001112233` -> `+523001112233`, `+523001112233`.
- En caso de múltiples usuarios con mismo número (no recomendado) se actualizan todos via `updateMany`.
- Extender en el futuro con rate limiting y guardas JWT.
