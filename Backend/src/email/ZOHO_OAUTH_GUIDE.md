# Guía de Configuración OAuth2 para Zoho Mail

## 📋 Resumen

Este módulo implementa el flujo OAuth2 de Zoho Mail con regeneración automática de access tokens usando variables de entorno.

## 🔧 Configuración Inicial

### 1️⃣ Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env`:

```env
# Configuración básica de Zoho OAuth
ZOHO_CLIENT_ID=tu_client_id_aqui
ZOHO_CLIENT_SECRET=tu_client_secret_aqui
ZOHO_REDIRECT_URI=https://tu-dominio.com/api/email/callback
ZOHO_API_DOMAIN=https://mail.zoho.com  # Opcional, por defecto usa mail.zoho.com

# Esta variable la obtendrás después del primer flujo de autorización
# ZOHO_REFRESH_TOKEN=  (se llenará después)

# Habilitar autenticación HTTP
MAIL_USE_HTTP=true
```

### 2️⃣ Flujo de Autorización (Solo la Primera Vez)

#### Paso 1: Obtener el Refresh Token

1. **Visita la URL de autorización:**
   ```
   GET /api/email/auth
   ```
   Esto te redirigirá a la página de consentimiento de Zoho.

2. **Acepta los permisos** solicitados por la aplicación.

3. **Zoho te redirigirá** a tu `ZOHO_REDIRECT_URI` con un código:
   ```
   https://tu-dominio.com/api/email/callback?code=1000.xxxxx.yyyyy
   ```

4. **Intercambia el código por tokens:**
   ```
   GET /api/email/callback?code=1000.xxxxx.yyyyy
   ```

5. **Copia el REFRESH_TOKEN** que aparecerá en los logs con este formato:
   ```
   ╔════════════════════════════════════════════════════════════════════════════╗
   ║  🎉 REFRESH TOKEN OBTENIDO - COPIA ESTO A TU VARIABLE DE ENTORNO         ║
   ╠════════════════════════════════════════════════════════════════════════════╣
   
   🔑 ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyy
   
   ╠════════════════════════════════════════════════════════════════════════════╣
   ```

#### Paso 2: Configurar la Variable de Entorno

1. **En Railway (o tu servicio de hosting):**
   - Ve a las variables de entorno de tu proyecto
   - Agrega: `ZOHO_REFRESH_TOKEN=<el_token_que_copiaste>`
   - Guarda los cambios

2. **Reinicia la aplicación**

#### Paso 3: Verificación

Una vez reiniciada la aplicación, deberías ver en los logs:

```
[ZohoOAuthService] [INIT] ZOHO_REFRESH_TOKEN encontrado, inicializando con refresh token desde variables de entorno
[ZohoOAuthService] [REFRESH_TOKEN] 🔄 Refrescando access token...
[ZohoOAuthService] [REFRESH_TOKEN_SUCCESS] ✅ Access token refrescado correctamente
[ZohoOAuthService] [INIT] ✅ Access token obtenido exitosamente usando ZOHO_REFRESH_TOKEN
```

## 🚀 Uso del Servicio

### Método Principal: `getAccessToken()`

Este es el método que debes usar para obtener tokens. Se encarga automáticamente de:
- Verificar si el token está vigente
- Refrescarlo si está próximo a expirar (menos de 5 minutos)
- Manejar errores y logging

```typescript
import { ZohoOAuthService } from './zoho-oauth.service';

@Injectable()
export class EmailService {
    constructor(private readonly zohoAuth: ZohoOAuthService) {}

    async sendEmail() {
        try {
            // Obtener access token (se refresca automáticamente si es necesario)
            const accessToken = await this.zohoAuth.getAccessToken();
            const apiDomain = this.zohoAuth.getApiDomain();

            // Usar el token para hacer peticiones a la API de Zoho
            const response = await fetch(`${apiDomain}/api/accounts/your_account_id/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // ... tu contenido del email
                }),
            });

            // ... manejar respuesta
        } catch (error) {
            console.error('Error al enviar email:', error);
            throw error;
        }
    }
}
```

## 📖 API del Servicio

### Métodos Públicos

#### `getAccessToken(): Promise<string>`
Obtiene un access token válido. Se refresca automáticamente si está próximo a expirar.

```typescript
const token = await zohoAuthService.getAccessToken();
```

#### `getAuthorizationUrl(): string`
Genera la URL para el flujo de autorización inicial (solo necesario la primera vez).

```typescript
const authUrl = zohoAuthService.getAuthorizationUrl();
// Redirige al usuario a esta URL
```

#### `exchangeCodeForTokens(code: string): Promise<ZohoTokenData>`
Intercambia el código de autorización por tokens. Imprime el refresh_token en consola.

```typescript
const tokens = await zohoAuthService.exchangeCodeForTokens(code);
```

#### `getApiDomain(): string`
Obtiene el dominio API de Zoho.

```typescript
const domain = zohoAuthService.getApiDomain();
// Retorna: 'https://mail.zoho.com' o el dominio configurado en ZOHO_API_DOMAIN
```

#### `hasToken(): boolean`
Verifica si hay un token disponible (en memoria o en variables de entorno).

```typescript
if (zohoAuthService.hasToken()) {
    // Puede obtener access tokens
}
```

## 🔄 Flujo de Regeneración Automática

```
┌─────────────────────────────────────────────────────────────┐
│  Aplicación se inicia                                       │
│  ↓                                                           │
│  ¿Existe ZOHO_REFRESH_TOKEN en variables de entorno?        │
│  ├─ SÍ → Usar ese refresh token                             │
│  │   ↓                                                       │
│  │   Obtener access token usando refresh token              │
│  │   ↓                                                       │
│  │   ✅ Listo para enviar emails                            │
│  │                                                           │
│  └─ NO → Esperar flujo de autorización manual               │
│      ↓                                                       │
│      Usuario visita /api/email/auth                         │
│      ↓                                                       │
│      Usuario acepta permisos en Zoho                        │
│      ↓                                                       │
│      Callback recibe código                                 │
│      ↓                                                       │
│      Intercambia código por tokens                          │
│      ↓                                                       │
│      🔑 REFRESH_TOKEN impreso en consola                    │
│      ↓                                                       │
│      Usuario copia y agrega a variables de entorno          │
│      ↓                                                       │
│      Reinicia aplicación                                    │
│      ↓                                                       │
│      ✅ Listo para enviar emails                            │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Seguridad

- **NO compartas** tu `ZOHO_REFRESH_TOKEN` públicamente
- **NO lo subas** a GitHub (está en .gitignore)
- Solo configúralo en las **variables de entorno** de tu servicio de hosting
- El `refresh_token` no expira a menos que:
  - Revokes el acceso manualmente en Zoho
  - Cambies las credenciales de la app
  - El usuario cambie su contraseña y revoque tokens

## 🐛 Debugging

### Logs Útiles

El servicio genera logs detallados para facilitar el debugging:

```
[INIT] - Inicialización del módulo
[EXCHANGE_CODE] - Intercambio de código por tokens
[REFRESH_TOKEN] - Refresco de access token
[GET_ACCESS_TOKEN] - Obtención de access token
```

### Problemas Comunes

#### "No hay refresh_token disponible"
- Solución: Completa el flujo de autorización visitando `/api/email/auth`

#### "Error al refrescar token"
- Posibles causas:
  - El refresh_token ha sido revocado
  - Las credenciales de la app son incorrectas
  - El usuario cambió su contraseña
- Solución: Volver a hacer el flujo de autorización

#### "Faltan variables de entorno"
- Verifica que tengas configuradas:
  - `ZOHO_CLIENT_ID`
  - `ZOHO_CLIENT_SECRET`
  - `ZOHO_REDIRECT_URI`

## 📝 Ejemplo de Controlador

```typescript
import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ZohoOAuthService } from './zoho-oauth.service';

@Controller('email')
export class EmailController {
    constructor(private readonly zohoAuth: ZohoOAuthService) {}

    @Get('auth')
    async initiateAuth(@Res() res: Response) {
        const authUrl = this.zohoAuth.getAuthorizationUrl();
        return res.redirect(authUrl);
    }

    @Get('callback')
    async handleCallback(@Query('code') code: string) {
        if (!code) {
            throw new Error('No se recibió código de autorización');
        }

        const tokens = await this.zohoAuth.exchangeCodeForTokens(code);
        
        return {
            success: true,
            message: 'Autorización exitosa. Revisa los logs para obtener el ZOHO_REFRESH_TOKEN',
            expires_in: tokens.expires_in,
        };
    }

    @Get('test')
    async testToken() {
        const accessToken = await this.zohoAuth.getAccessToken();
        return {
            success: true,
            message: 'Token obtenido correctamente',
            hasToken: !!accessToken,
            apiDomain: this.zohoAuth.getApiDomain(),
        };
    }
}
```

## 🎯 Ventajas de Este Enfoque

✅ **Sin archivos locales**: Todo se maneja con variables de entorno  
✅ **Regeneración automática**: Los access tokens se refrescan automáticamente  
✅ **Railway-friendly**: Fácil de configurar en servicios cloud  
✅ **Sin consentimiento manual**: Una vez configurado, funciona automáticamente  
✅ **Logs claros**: Fácil debugging con logs descriptivos  
✅ **Type-safe**: Todo tipado con TypeScript  

## 📚 Referencias

- [Zoho OAuth Documentation](https://www.zoho.com/mail/help/api/oauth.html)
- [Zoho Mail API](https://www.zoho.com/mail/help/api/)
