/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SNIPPET RÁPIDO: Uso del Flujo OAuth2 de Zoho Mail
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este archivo contiene ejemplos rápidos de cómo usar el servicio OAuth
 */

import { Injectable, Logger } from '@nestjs/common';
import { ZohoOAuthService } from './zoho-oauth.service';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EJEMPLO 1: Enviar un email usando el servicio OAuth
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@Injectable()
export class EmailSenderExample {
    private readonly logger = new Logger(EmailSenderExample.name);

    constructor(private readonly zohoAuth: ZohoOAuthService) {}

    async sendWelcomeEmail(userEmail: string, userName: string) {
        try {
            // 🔑 Obtener access token (se refresca automáticamente si es necesario)
            const accessToken = await this.zohoAuth.getAccessToken();
            const apiDomain = this.zohoAuth.getApiDomain();

            // 📧 Construir el mensaje
            const emailPayload = {
                fromAddress: 'noreply@tudominio.com',
                toAddress: userEmail,
                subject: `¡Bienvenido ${userName}!`,
                mailContent: `<h1>Hola ${userName}</h1><p>Gracias por registrarte.</p>`,
                askReceipt: 'no',
            };

            // 📤 Enviar el email a Zoho
            const response = await fetch(
                `${apiDomain}/api/accounts/YOUR_ACCOUNT_ID/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Zoho-oauthtoken ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(emailPayload),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al enviar email: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            this.logger.log(`✅ Email enviado exitosamente a ${userEmail}`);
            return result;

        } catch (error) {
            this.logger.error(`❌ Error al enviar email: ${error.message}`);
            throw error;
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EJEMPLO 2: Verificar el estado del token antes de enviar
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@Injectable()
export class EmailServiceWithValidation {
    constructor(private readonly zohoAuth: ZohoOAuthService) {}

    async sendEmailSafely(to: string, subject: string, content: string) {
        // Verificar si tenemos token disponible
        if (!this.zohoAuth.hasToken()) {
            throw new Error(
                'No hay token OAuth disponible. ' +
                'Visita /api/email/auth para autorizar la aplicación.'
            );
        }

        // Si llegamos aquí, podemos obtener el access token
        const accessToken = await this.zohoAuth.getAccessToken();
        
        // ... proceder con el envío del email
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EJEMPLO 3: Manejo de errores y reintentos
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@Injectable()
export class RobustEmailService {
    private readonly logger = new Logger(RobustEmailService.name);

    constructor(private readonly zohoAuth: ZohoOAuthService) {}

    async sendEmailWithRetry(emailData: any, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.log(`Intento ${attempt} de ${maxRetries}`);
                
                const accessToken = await this.zohoAuth.getAccessToken();
                const apiDomain = this.zohoAuth.getApiDomain();

                const response = await fetch(
                    `${apiDomain}/api/accounts/YOUR_ACCOUNT_ID/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Zoho-oauthtoken ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(emailData),
                    }
                );

                if (response.ok) {
                    this.logger.log(`✅ Email enviado en intento ${attempt}`);
                    return await response.json();
                }

                // Si es un error 401, el token puede estar inválido
                if (response.status === 401 && attempt < maxRetries) {
                    this.logger.warn('Token inválido, refrescando...');
                    // El próximo intento obtendrá un token fresco
                    continue;
                }

                throw new Error(`HTTP ${response.status}: ${await response.text()}`);

            } catch (error) {
                if (attempt === maxRetries) {
                    this.logger.error(`❌ Falló después de ${maxRetries} intentos`);
                    throw error;
                }
                
                this.logger.warn(`Intento ${attempt} falló, reintentando...`);
                await this.sleep(1000 * attempt); // Backoff exponencial
            }
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURACIÓN DE VARIABLES DE ENTORNO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Agrega estas variables a tu archivo .env:
 * 
 * # OAuth Zoho Mail
 * ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXX
 * ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * ZOHO_REDIRECT_URI=https://tu-dominio.com/api/email/auth/callback
 * ZOHO_API_DOMAIN=https://mail.zoho.com
 * 
 * # Este lo obtendrás después del primer flujo OAuth
 * ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * 
 * # Habilitar autenticación HTTP
 * MAIL_USE_HTTP=true
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FLUJO DE CONFIGURACIÓN INICIAL (SOLO UNA VEZ)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * PASO 1: Configura las variables de entorno (excepto ZOHO_REFRESH_TOKEN)
 * 
 * PASO 2: Inicia tu aplicación y visita:
 *         GET https://tu-dominio.com/api/email/auth
 * 
 * PASO 3: Acepta los permisos en la página de Zoho
 * 
 * PASO 4: Zoho te redirigirá al callback con un código
 * 
 * PASO 5: El servicio intercambiará el código por tokens e imprimirá en consola:
 * 
 *         ╔════════════════════════════════════════════════════════════════╗
 *         ║  🎉 REFRESH TOKEN OBTENIDO                                    ║
 *         ╠════════════════════════════════════════════════════════════════╣
 *         
 *         🔑 ZOHO_REFRESH_TOKEN=1000.xxxxxxx.yyyyyyy
 *         
 *         ╠════════════════════════════════════════════════════════════════╣
 *         ║  Copia este token y agrégalo a tus variables de entorno       ║
 *         ╚════════════════════════════════════════════════════════════════╝
 * 
 * PASO 6: Copia el ZOHO_REFRESH_TOKEN de los logs y agrégalo a tus variables
 *         de entorno en Railway
 * 
 * PASO 7: Reinicia la aplicación
 * 
 * PASO 8: ¡Listo! Ahora el access_token se regenerará automáticamente
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENDPOINTS DISPONIBLES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/email/auth
 * - Inicia el flujo OAuth
 * - Redirige a Zoho para autorización
 * 
 * GET /api/email/auth/callback?code=xxx
 * - Callback después de la autorización
 * - Intercambia el código por tokens
 * - Imprime el ZOHO_REFRESH_TOKEN en consola
 * 
 * GET /api/email/auth/status
 * - Verifica si la aplicación está autorizada
 * - Retorna: { authorized: true/false, message: "..." }
 * 
 * POST /api/email/send
 * - Envía un email (usa automáticamente el OAuth)
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VENTAJAS DE ESTE ENFOQUE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * ✅ Sin archivos locales - Todo en variables de entorno
 * ✅ Regeneración automática - Los access tokens se refrescan solos
 * ✅ Railway-friendly - Fácil de configurar en servicios cloud
 * ✅ Sin consentimiento manual - Una vez configurado, funciona siempre
 * ✅ Logs claros - Fácil debugging
 * ✅ Type-safe - Todo tipado con TypeScript
 * ✅ Gestión de errores - Manejo robusto de errores y reintentos
 */
