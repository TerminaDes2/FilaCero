# 📧 Sistema de Email Multi-Cuenta con Zoho OAuth

## ✨ Características

El sistema ahora soporta **múltiples cuentas de Zoho Mail** con credenciales OAuth independientes. Esto significa que puedes enviar correos desde diferentes direcciones (como `no-reply@filacero.store` y `privacity@filacero.store`) usando credenciales OAuth separadas para cada una.

## 🔑 Funcionamiento

El sistema detecta automáticamente qué credenciales usar basándose en el **email del remitente** (`from`):

- **no-reply@filacero.store** → Usa `ZOHO_CLIENT_ID_NOREPLY`, `ZOHO_CLIENT_SECRET_NOREPLY`, `ZOHO_REFRESH_TOKEN_NOREPLY`
- **privacity@filacero.store** → Usa `ZOHO_CLIENT_ID_PRIVACITY`, `ZOHO_CLIENT_SECRET_PRIVACITY`, `ZOHO_REFRESH_TOKEN_PRIVACITY`
- **Otros emails** → Usa las credenciales por defecto `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`

## 📝 Configuración

### 1. Variables de Entorno

```bash
# Credenciales para no-reply@filacero.store
ZOHO_CLIENT_ID_NOREPLY=1000.XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET_NOREPLY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_REFRESH_TOKEN_NOREPLY=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Credenciales para privacity@filacero.store
ZOHO_CLIENT_ID_PRIVACITY=1000.YYYYYYYYYYYYYYYYYYYYYYYYYYY
ZOHO_CLIENT_SECRET_PRIVACITY=yyyyyyyyyyyyyyyyyyyyyyyyyyyyy
ZOHO_REFRESH_TOKEN_PRIVACITY=1000.yyyyyyyyyyyyyyyyyyyyyyyyyyyyy

# Configuración general
MAIL_USE_HTTP=true
ZOHO_API_DOMAIN=https://mail.zoho.com
ZOHO_REDIRECT_URI=http://localhost:3000/api/email/callback

# Direcciones de email
MAIL_NOREPLY_FROM=no-reply@filacero.store
MAIL_PRIVACY_FROM=privacity@filacero.store
```

### 2. Obtener el Refresh Token

Para cada cuenta que quieras configurar:

#### Opción A: Usando el flujo OAuth en la app

1. Configura `ZOHO_CLIENT_ID` y `ZOHO_CLIENT_SECRET` para la cuenta por defecto
2. Inicia el servidor: `npm run start:dev`
3. Visita: `http://localhost:3000/api/email/auth`
4. Inicia sesión con la cuenta de Zoho correspondiente (ej: no-reply@filacero.store)
5. Autoriza la aplicación
6. Copia el `REFRESH_TOKEN` que aparece en los logs de la consola
7. Pégalo en la variable de entorno correspondiente:
   - Para no-reply: `ZOHO_REFRESH_TOKEN_NOREPLY`
   - Para privacity: `ZOHO_REFRESH_TOKEN_PRIVACITY`
8. Reinicia el servidor

#### Opción B: Manualmente desde la consola de Zoho

Consulta la documentación oficial de Zoho OAuth: https://www.zoho.com/mail/help/api/oauth.html

## 🚀 Uso

### Enviar email con código

```typescript
import { EmailService } from './email/email.service';

// El sistema automáticamente usará las credenciales correctas según el 'from'
await emailService.sendEmail({
  mailOptions: {
    from: 'no-reply@filacero.store',  // Usará credenciales de NOREPLY
    to: 'usuario@ejemplo.com',
    subject: 'Bienvenido',
    html: '<h1>¡Hola!</h1>'
  }
});

await emailService.sendEmail({
  mailOptions: {
    from: 'privacity@filacero.store',  // Usará credenciales de PRIVACITY
    to: 'usuario@ejemplo.com',
    subject: 'Política de Privacidad',
    html: '<p>...</p>'
  }
});
```

### Endpoint de prueba

```bash
POST http://localhost:3000/api/email/send
Content-Type: application/json

{
  "mailOptions": {
    "from": "no-reply@filacero.store",
    "to": "destinatario@ejemplo.com",
    "subject": "Prueba",
    "html": "<h1>Email de prueba</h1>"
  }
}
```

## 🔄 Gestión Automática de Tokens

El sistema gestiona automáticamente los tokens de acceso:

- ✅ **Refresco automático**: Los tokens se renuevan automáticamente 10 minutos antes de expirar
- ✅ **Independiente por cuenta**: Cada cuenta tiene su propio ciclo de renovación
- ✅ **Resistente a fallos**: Si una renovación falla, el sistema reintenta después de 1 minuto
- ✅ **Logging detallado**: Todos los eventos se registran para facilitar el debugging

## 🏗️ Arquitectura

### Flujo de envío de email

```
1. EmailService recibe la solicitud con mailOptions.from
   ↓
2. EmailProcessor procesa la cola de emails
   ↓
3. ZohoHttpService.sendEmail(mailOptions)
   ↓
4. ZohoOAuthService.getAccessTokenForEmail(mailOptions.from)
   ↓
5. ZohoOAuthService detecta qué credenciales usar según el email
   ↓
6. ZohoOAuthService devuelve el access_token válido
   ↓
7. ZohoHttpService envía el email con el token correcto
```

### Archivos principales

- **`zoho-oauth.service.ts`**: Gestiona múltiples cuentas OAuth, tokens, y renovación automática
- **`zoho-http.service.ts`**: Envía emails usando la API HTTP de Zoho
- **`email.service.ts`**: Servicio principal que encola emails
- **`email.processor.ts`**: Procesador de la cola de emails
- **`envs.ts`**: Configuración de variables de entorno

## 🐛 Debugging

### Ver el estado de los tokens

Los logs muestran información detallada:

```
[INIT] Inicializando cuenta para no-reply@filacero.store
[INIT] ✅ Access token obtenido exitosamente para no-reply@filacero.store
[SCHEDULE_REFRESH] ⏰ Próxima renovación para no-reply@filacero.store en 50 minutos
```

### Errores comunes

**Error**: `No hay credenciales configuradas para xxx@filacero.store`
- **Solución**: Asegúrate de tener configuradas las variables de entorno correctas

**Error**: `Error al refrescar token: 400`
- **Solución**: El refresh token puede haber expirado. Vuelve a autorizar la aplicación

**Error**: `Error al enviar email: 401`
- **Solución**: El token de acceso es inválido. Verifica las credenciales OAuth

## 📚 Recursos

- [Documentación oficial de Zoho Mail API](https://www.zoho.com/mail/help/api/)
- [Zoho OAuth 2.0](https://www.zoho.com/accounts/protocol/oauth.html)
- [Guía completa en ZOHO_OAUTH_GUIDE.md](./ZOHO_OAUTH_GUIDE.md)
- [Configuración multi-cuenta en MULTI_ACCOUNT_CONFIG.md](./MULTI_ACCOUNT_CONFIG.md)

## ⚙️ Configuración Avanzada

### Usar CLIENT_ID y CLIENT_SECRET compartidos

Si todas tus cuentas de email están bajo la misma organización de Zoho, puedes compartir el mismo CLIENT_ID y CLIENT_SECRET:

```bash
# Credenciales compartidas
ZOHO_CLIENT_ID=1000.SHARED_CLIENT_ID
ZOHO_CLIENT_SECRET=shared_client_secret

# Solo necesitas diferentes REFRESH_TOKEN para cada cuenta
ZOHO_REFRESH_TOKEN_NOREPLY=1000.refresh_token_noreply
ZOHO_REFRESH_TOKEN_PRIVACITY=1000.refresh_token_privacity
```

El sistema usará automáticamente las credenciales compartidas si no encuentra credenciales específicas para una cuenta.

### Fallback a credenciales por defecto

Si envías un email desde una dirección que no tiene credenciales específicas, el sistema usará las credenciales por defecto (`ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`).

---

**Última actualización**: 2025-11-20
