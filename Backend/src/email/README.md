# Sistema de Envío de Emails con Zoho OAuth HTTP

## Descripción

Este módulo implementa un sistema completo de envío de emails que soporta dos modos de operación:

1. **SMTP tradicional** (por defecto): Usa Nodemailer con credenciales SMTP
2. **Zoho HTTP API** (cuando `MAIL_USE_HTTP=true`): Usa OAuth 2.0 y la API REST de Zoho Mail

## Configuración

### Variables de Entorno

```env
# Activar envío por HTTP (Zoho API)
MAIL_USE_HTTP=true

# Credenciales OAuth de Zoho
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REDIRECT_URI=
```

### Obtener Credenciales de Zoho

1. Visita [Zoho API Console](https://api-console.zoho.com/)
2. Crea una nueva aplicación "Server-based Applications"
3. Configura los scopes necesarios:
   - `ZohoMail.messages.CREATE`
   - `ZohoMail.accounts.READ`
4. Copia el `Client ID` y `Client Secret`
5. Configura la Redirect URI (debe coincidir con `ZOHO_REDIRECT_URI`)

## Flujo de Autorización OAuth

### Primera Vez (Autorización)

1. **Iniciar autorización:**
   ```
   GET https://api.filacero.store/api/email/auth
   ```
   
   Esto redirigirá automáticamente al usuario a Zoho para autorizar la aplicación.

2. **Callback automático:**
   Después de autorizar, Zoho redirige automáticamente a:
   ```
   GET https://api.filacero.store/api/email/auth/callback?code=XXXXXXXX
   ```
   
   El sistema automáticamente:
   - Intercambia el código por tokens de acceso y refresco
   - Guarda los tokens en `zoho-token.json`
   - Retorna confirmación de autorización exitosa

3. **Verificar estado:**
   ```bash
   curl https://api.filacero.store/api/email/auth/status
   ```
   
   Respuesta:
   ```json
   {
     "authorized": true,
     "message": "La aplicación está autorizada para enviar emails vía Zoho"
   }
   ```

### Gestión Automática de Tokens

El sistema gestiona automáticamente:
- **Refresco de tokens**: Si el access token expira en menos de 5 minutos, se refresca automáticamente
- **Persistencia**: Los tokens se guardan en `zoho-token.json` en el directorio raíz del backend
- **Recuperación**: Al reiniciar el servidor, los tokens se cargan desde el archivo

## Uso

### Configuración Actual del Sistema

El sistema ya está integrado con la infraestructura existente de emails. Cuando activas `MAIL_USE_HTTP=true`:

- ✅ **Se mantienen las mismas llamadas a `emailService.sendEmail()`**
- ✅ **Se respetan los mismos `mailOptions.from`** (no-reply@filacero.store, contacto@filacero.store, etc.)
- ✅ **El `smtpConfig` se ignora completamente** cuando MAIL_USE_HTTP=true
- ✅ **Zoho OAuth envía desde la cuenta autorizada** independientemente del `smtpConfig`

**Ejemplo actual del código:**
```typescript
// Código existente en email-verification.service.ts
const { smtpConfig, from } = this.resolveMailAccount('noreply');
await this.emailService.sendEmail({
    smtpConfig,  // ← Se ignora si MAIL_USE_HTTP=true
    mailOptions: {
        from,     // ← Este valor SÍ se usa con Zoho HTTP
        to: email,
        subject: 'Tu código de verificación',
        html: '...',
    },
});
```

Cuando `MAIL_USE_HTTP=true`:
- El sistema usa `mailOptions.from` para enviar
- Zoho OAuth envía desde la cuenta autorizada (debe coincidir con `from`)
- No necesitas cambiar ningún código existente

### Enviar Email (API Endpoint)

```bash
POST https://api.filacero.store/api/email/send
Content-Type: application/json

{
  "mailOptions": {
    "from": "no-reply@filacero.store",
    "to": "usuario@ejemplo.com",
    "subject": "Bienvenido a FilaCero",
    "html": "<h1>Hola!</h1><p>Este es un email de prueba.</p>",
    "text": "Hola! Este es un email de prueba."
  },
  "smtpConfig": {
    "host": "smtp.zoho.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "no-reply@filacero.store",
      "pass": "password"
    }
  }
}
```

**Nota:** Aunque incluyas `smtpConfig`, si `MAIL_USE_HTTP=true`, el sistema usará Zoho HTTP API y el `smtpConfig` será ignorado.

### Enviar Email (Programáticamente)

```typescript
import { EmailService } from './email/email.service';

@Injectable()
export class MiServicio {
  constructor(private readonly emailService: EmailService) {}

  async enviarBienvenida(email: string) {
    await this.emailService.sendEmail({
      mailOptions: {
        from: 'no-reply@filacero.store',
        to: email,
        subject: 'Bienvenido a FilaCero',
        html: '<h1>Bienvenido!</h1>',
        text: 'Bienvenido!',
      },
      smtpConfig: {
        host: 'smtp.zoho.com',
        port: 587,
        secure: false,
        auth: {
          user: 'no-reply@filacero.store',
          pass: 'password',
        },
      },
    });
  }
}
```

## Arquitectura

### Servicios

1. **ZohoOAuthService** (`zoho-oauth.service.ts`)
   - Gestiona el flujo OAuth completo
   - Obtiene y refresca tokens de acceso
   - Persiste tokens en disco
   - Se inicializa automáticamente al arrancar el módulo

2. **ZohoHttpService** (`zoho-http.service.ts`)
   - Envía emails mediante la API HTTP de Zoho
   - Obtiene el `accountId` necesario para enviar
   - Valida parámetros de entrada
   - Maneja errores de la API de Zoho

3. **EmailProcessor** (`email.processor.ts`)
   - Procesa trabajos de la cola de emails
   - Decide entre HTTP o SMTP según `MAIL_USE_HTTP`
   - Sanitiza HTML para seguridad
   - Implementa reintentos automáticos (3 intentos con backoff exponencial)

### Flujo de Envío

```
POST /api/email/send
    ↓
EmailService.sendEmail()
    ↓
[Cola Bull] → EmailProcessor.handleSendEmail()
    ↓
¿MAIL_USE_HTTP?
    ├─ true  → sendViaZohoHttp()
    │            ↓
    │         ZohoHttpService.sendEmail()
    │            ↓
    │         ZohoOAuthService.getValidAccessToken()
    │            ↓
    │         POST https://mail.zoho.com/api/accounts/{accountId}/messages
    │
    └─ false → sendViaSmtp()
                 ↓
              Nodemailer (SMTP tradicional)
```

## Manejo de Errores

### Tokens Caducados

Si el access token expira, el sistema automáticamente:
1. Detecta la expiración (5 minutos de buffer)
2. Usa el refresh token para obtener un nuevo access token
3. Guarda el nuevo token
4. Reintenta el envío

### Errores de Autorización (401)

Si Zoho responde con 401:
- El sistema lanza un error indicando que debes reautorizar
- Visita `/api/email/auth` para volver a autorizar

### Errores de Validación (4xx)

El sistema valida:
- Email `to` y `from` deben tener formato válido
- `subject` es requerido
- Al menos `html` o `text` debe estar presente

### Errores del Servidor de Zoho (5xx)

Los errores 5xx se propagan con el mensaje de error completo para debugging.

### Reintentos

La cola de Bull implementa:
- **3 intentos** por defecto
- **Backoff exponencial**: 5s, 10s, 20s entre reintentos

## Seguridad

### Sanitización de HTML

Todo el HTML se sanitiza con `sanitize-html` antes de enviarse:
- Elimina scripts y contenido peligroso
- Permite etiquetas y estilos seguros para emails
- Preserva estructura y diseño visual

### Almacenamiento de Tokens

- Los tokens se guardan en `zoho-token.json` en el filesystem
- **IMPORTANTE**: Añade `zoho-token.json` a `.gitignore`
- En producción, considera usar variables de entorno o un servicio de secrets

### Logs Seguros

Los logs enmascaran información sensible:
- Contraseñas SMTP
- Tokens de acceso
- Datos personales

## Testing

### Verificar Estado de Autorización

```bash
curl https://api.filacero.store/api/email/auth/status
```

### Enviar Email de Prueba

```bash
curl -X POST https://api.filacero.store/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "mailOptions": {
      "from": "no-reply@filacero.store",
      "to": "test@ejemplo.com",
      "subject": "Test",
      "html": "<p>Test email</p>"
    },
    "smtpConfig": {
      "host": "smtp.zoho.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "no-reply@filacero.store",
        "pass": "password"
      }
    }
  }'
```

### Logs

Revisa los logs del backend para ver el flujo:

```
[EmailService] [QUEUE_ADD] email-queue/send-email payloadMasked=...
[EmailService] [QUEUE_ENQUEUED] jobId=1 attempts=3
[EmailProcessor] [JOB_START] id=1 attemptsMade=0/3 ...
[EmailProcessor] [ZOHO_HTTP_SENDING] id=1 to=test@ejemplo.com subject=Test
[ZohoHttpService] [SEND_EMAIL] to=test@ejemplo.com subject=Test
[ZohoOAuthService] [GET_TOKEN] Token válido, no se requiere refresco
[ZohoHttpService] [GET_ACCOUNT_ID] Obteniendo accountId
[ZohoHttpService] [ZOHO_API_CALL] POST https://mail.zoho.com/api/accounts/123456/messages
[ZohoHttpService] [ZOHO_EMAIL_SENT] messageId=abc123 status=200
[EmailProcessor] [ZOHO_HTTP_SENT] id=1 messageId=abc123 status=200
[EmailProcessor] [QUEUE_COMPLETED] id=1 result=...
```

## Troubleshooting

### Error: "No hay token disponible"

**Causa:** La aplicación no ha sido autorizada.

**Solución:**
1. Visita `https://api.filacero.store/api/email/auth`
2. Autoriza la aplicación en Zoho
3. Verifica con `/api/email/auth/status`

### Error: "Token de acceso inválido o expirado"

**Causa:** El refresh token es inválido o ha sido revocado.

**Solución:**
1. Elimina `zoho-token.json`
2. Vuelve a autorizar visitando `/api/email/auth`

### Error: "No se encontraron cuentas de Zoho Mail"

**Causa:** El usuario que autorizó no tiene cuentas de Zoho Mail configuradas.

**Solución:** Verifica que la cuenta de Zoho tenga acceso a Zoho Mail.

### Los emails no se envían (modo HTTP)

**Diagnóstico:**
1. Verifica `MAIL_USE_HTTP=true` en `.env`
2. Verifica autorización: `/api/email/auth/status`
3. Revisa logs del backend para errores específicos
4. Verifica que `from` corresponda a una cuenta válida en Zoho Mail

## Migración SMTP → HTTP

Para migrar de SMTP a HTTP:

1. **Obtén credenciales OAuth** de Zoho API Console

2. **Actualiza `.env`:**
   ```env
   MAIL_USE_HTTP=true
   ZOHO_CLIENT_ID=tu_client_id
   ZOHO_CLIENT_SECRET=tu_client_secret
   ZOHO_REDIRECT_URI=https://tu-dominio/api/email/auth/callback
   ```

3. **Reinicia el backend**

4. **Autoriza la aplicación:**
   - Visita `https://tu-dominio/api/email/auth`
   - Completa el flujo OAuth en Zoho

5. **Verifica:**
   ```bash
   curl https://tu-dominio/api/email/auth/status
   ```

6. **Prueba envío:**
   Envía un email de prueba y verifica logs para confirmar que usa `[ZOHO_HTTP_SENDING]`

## Ventajas de Zoho HTTP vs SMTP

| Característica | SMTP | Zoho HTTP (OAuth) |
|----------------|------|-------------------|
| Seguridad | Credenciales en texto plano | OAuth tokens con refresco automático |
| Límites | Depende del servidor SMTP | Más generosos con API |
| Monitoreo | Limitado | Acceso a APIs adicionales de Zoho |
| Revocación | Manual | Automática vía OAuth |
| Autenticación 2FA | Problemática | Compatible |

## Próximas Mejoras

- [ ] Caché de `accountId` para evitar llamada adicional
- [ ] Soporte para adjuntos (`attachments`)
- [ ] Soporte para CC/BCC
- [ ] Métricas de tasa de envío y errores
- [ ] Dashboard de estado de autorización
- [ ] Rotación automática de cuentas de envío
