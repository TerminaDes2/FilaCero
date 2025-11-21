import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { envs } from 'src/config';

interface ZohoCredentials {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
}

interface ZohoTokenData {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    api_domain: string;
    expires_at: number; // timestamp calculado localmente
}

interface ZohoTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    api_domain?: string;
}

@Injectable()
export class ZohoOAuthService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ZohoOAuthService.name);
    // Map para almacenar tokens por email (clave: email, valor: token data)
    private tokenDataMap: Map<string, ZohoTokenData> = new Map();
    private refreshIntervalIds: Map<string, NodeJS.Timeout> = new Map();

    async onModuleInit() {
        if (!envs.mailUseHttp) {
            this.logger.log('[INIT] MAIL_USE_HTTP=false, OAuth no requerido');
            return;
        }

        // Inicializar token para no-reply si existe
        if (envs.zohoRefreshTokenNoreply && envs.mailNoreplyFrom) {
            await this.initializeAccount(
                envs.mailNoreplyFrom,
                {
                    clientId: envs.zohoClientIdNoreply || envs.zohoClientId || '',
                    clientSecret: envs.zohoClientSecretNoreply || envs.zohoClientSecret || '',
                    refreshToken: envs.zohoRefreshTokenNoreply,
                }
            );
        }

        // Inicializar token para privacity si existe
        if (envs.zohoRefreshTokenPrivacity && envs.mailPrivacyFrom) {
            await this.initializeAccount(
                envs.mailPrivacyFrom,
                {
                    clientId: envs.zohoClientIdPrivacity || envs.zohoClientId || '',
                    clientSecret: envs.zohoClientSecretPrivacity || envs.zohoClientSecret || '',
                    refreshToken: envs.zohoRefreshTokenPrivacity,
                }
            );
        }

        // Inicializar token por defecto si existe (legacy)
        if (envs.zohoRefreshToken && envs.mailFrom) {
            await this.initializeAccount(
                envs.mailFrom,
                {
                    clientId: envs.zohoClientId || '',
                    clientSecret: envs.zohoClientSecret || '',
                    refreshToken: envs.zohoRefreshToken,
                }
            );
        }

        if (this.tokenDataMap.size === 0) {
            this.logger.warn('[INIT] ⚠️  No hay ZOHO_REFRESH_TOKEN disponible para ninguna cuenta.');
            this.logger.warn('[INIT] Debes autorizar la aplicación visitando /api/email/auth para obtener el refresh token.');
        }
    }

    /**
     * Inicializa una cuenta con su refresh token
     */
    private async initializeAccount(email: string, credentials: ZohoCredentials) {
        this.logger.log(`[INIT] Inicializando cuenta para ${email}`);
        
        this.tokenDataMap.set(email, {
            access_token: '',
            refresh_token: credentials.refreshToken,
            expires_in: 0,
            token_type: 'Bearer',
            api_domain: envs.zohoApiDomain || 'https://mail.zoho.com',
            expires_at: 0, // Forzará un refresh inmediato
        });

        try {
            // Obtener el primer access_token usando el refresh_token
            await this.refreshAccessTokenForEmail(email, credentials);
            this.logger.log(`[INIT] ✅ Access token obtenido exitosamente para ${email}`);
            
            // Programar renovación automática del token
            this.scheduleTokenRefresh(email, credentials);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[INIT] ❌ Error al obtener access token para ${email}: ${msg}`);
            this.logger.warn(`[INIT] Es posible que necesites reautorizar la aplicación para ${email}`);
        }
    }

    /**
     * Obtiene las credenciales correctas para un email
     */
    private getCredentialsForEmail(email: string): ZohoCredentials | null {
        const normalizedEmail = email.toLowerCase().trim();

        // Detectar qué cuenta usar basándose en el email
        if (normalizedEmail.includes('no-reply') || normalizedEmail.includes('noreply')) {
            if (envs.zohoRefreshTokenNoreply) {
                return {
                    clientId: envs.zohoClientIdNoreply || envs.zohoClientId || '',
                    clientSecret: envs.zohoClientSecretNoreply || envs.zohoClientSecret || '',
                    refreshToken: envs.zohoRefreshTokenNoreply,
                };
            }
        }

        if (normalizedEmail.includes('privacity') || normalizedEmail.includes('privacy')) {
            if (envs.zohoRefreshTokenPrivacity) {
                return {
                    clientId: envs.zohoClientIdPrivacity || envs.zohoClientId || '',
                    clientSecret: envs.zohoClientSecretPrivacity || envs.zohoClientSecret || '',
                    refreshToken: envs.zohoRefreshTokenPrivacity,
                };
            }
        }

        // Fallback a credenciales por defecto
        if (envs.zohoRefreshToken) {
            return {
                clientId: envs.zohoClientId || '',
                clientSecret: envs.zohoClientSecret || '',
                refreshToken: envs.zohoRefreshToken,
            };
        }

        return null;
    }

    /**
     * Obtiene la URL de autorización para el flujo OAuth inicial
     */
    getAuthorizationUrl(): string {
        if (!envs.zohoClientId || !envs.zohoRedirectUri) {
            throw new Error('Faltan credenciales de Zoho OAuth');
        }

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: envs.zohoClientId as string,
            scope: 'ZohoMail.messages.CREATE,ZohoMail.accounts.READ',
            redirect_uri: envs.zohoRedirectUri as string,
            access_type: 'offline',
            prompt: 'consent',
        });

        return `https://accounts.zoho.com/oauth/v2/auth?${params.toString()}`;
    }

    /**
     * Intercambia el código de autorización por tokens de acceso y refresco
     * IMPORTANTE: Imprime el refresh_token en consola para que lo copies a Railway
     */
    async exchangeCodeForTokens(code: string, email?: string): Promise<ZohoTokenData> {
        this.logger.log('[EXCHANGE_CODE] 🔄 Intercambiando código por tokens...');

        if (!envs.zohoClientId || !envs.zohoClientSecret || !envs.zohoRedirectUri) {
            throw new Error('Faltan credenciales de Zoho OAuth');
        }

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: envs.zohoClientId as string,
            client_secret: envs.zohoClientSecret as string,
            redirect_uri: envs.zohoRedirectUri as string,
            code,
        });

        try {
            const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[EXCHANGE_CODE_ERROR] ${response.status}: ${errorText}`);
                throw new Error(`Error al intercambiar código: ${response.status} ${errorText}`);
            }

            const data = await response.json() as ZohoTokenResponse;

            if (!data.access_token || !data.refresh_token) {
                throw new Error('Respuesta inválida de Zoho: faltan tokens');
            }

            const tokenData: ZohoTokenData = {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in,
                token_type: data.token_type,
                api_domain: data.api_domain || 'https://mail.zoho.com',
                expires_at: Date.now() + data.expires_in * 1000,
            };

            // Guardar en el map si se proporciona un email
            if (email) {
                this.tokenDataMap.set(email, tokenData);
            }

            // ⭐ IMPORTANTE: Imprimir el refresh_token en consola para copiarlo desde Railway
            this.logger.log('╔════════════════════════════════════════════════════════════════════════════╗');
            this.logger.log('║  🎉 REFRESH TOKEN OBTENIDO - COPIA ESTO A TU VARIABLE DE ENTORNO         ║');
            this.logger.log('╠════════════════════════════════════════════════════════════════════════════╣');
            console.log(`\n🔑 ZOHO_REFRESH_TOKEN${email ? `_${this.getAccountSuffix(email).toUpperCase()}` : ''}=${data.refresh_token}\n`);
            this.logger.log('╠════════════════════════════════════════════════════════════════════════════╣');
            this.logger.log('║  📝 Instrucciones:                                                         ║');
            this.logger.log('║  1. Copia el token anterior                                                ║');
            this.logger.log('║  2. Agrégalo a tus variables de entorno en Railway                        ║');
            this.logger.log('║  3. Reinicia la aplicación                                                 ║');
            this.logger.log('╚════════════════════════════════════════════════════════════════════════════╝');

            this.logger.log('[EXCHANGE_CODE_SUCCESS] ✅ Tokens obtenidos correctamente');

            return tokenData;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[EXCHANGE_CODE_EXCEPTION] ${msg}`);
            throw error;
        }
    }

    /**
     * Determina el sufijo de la cuenta basado en el email
     */
    private getAccountSuffix(email: string): string {
        const normalizedEmail = email.toLowerCase();
        if (normalizedEmail.includes('no-reply') || normalizedEmail.includes('noreply')) {
            return 'noreply';
        }
        if (normalizedEmail.includes('privacity') || normalizedEmail.includes('privacy')) {
            return 'privacity';
        }
        return '';
    }

    /**
     * Refresca el access token para un email específico
     */
    private async refreshAccessTokenForEmail(email: string, credentials: ZohoCredentials): Promise<string> {
        this.logger.log(`[REFRESH_TOKEN] 🔄 Refrescando access token para ${email}...`);

        if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken) {
            throw new Error(`Faltan credenciales de Zoho OAuth para ${email}`);
        }

        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            refresh_token: credentials.refreshToken,
        });

        try {
            const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[REFRESH_TOKEN_ERROR] ${response.status}: ${errorText}`);
                throw new Error(`Error al refrescar token para ${email}: ${response.status} ${errorText}`);
            }

            const data = await response.json() as ZohoTokenResponse;

            if (!data.access_token) {
                throw new Error('Respuesta inválida de Zoho: falta access_token');
            }

            // Actualizar o crear tokenData para este email
            const existingToken = this.tokenDataMap.get(email);
            const tokenData: ZohoTokenData = {
                access_token: data.access_token,
                refresh_token: credentials.refreshToken,
                expires_in: data.expires_in,
                token_type: data.token_type,
                api_domain: data.api_domain || existingToken?.api_domain || envs.zohoApiDomain || 'https://mail.zoho.com',
                expires_at: Date.now() + data.expires_in * 1000,
            };

            this.tokenDataMap.set(email, tokenData);

            this.logger.log(`[REFRESH_TOKEN_SUCCESS] ✅ Access token refrescado correctamente para ${email}`);
            this.logger.debug(`[REFRESH_TOKEN] Nuevo token expira en ${data.expires_in} segundos`);

            return tokenData.access_token;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[REFRESH_TOKEN_EXCEPTION] ${msg}`);
            throw error;
        }
    }

    /**
     * Obtiene un access token válido para un email específico
     * Esta es la función principal que debes usar para obtener tokens
     */
    async getAccessTokenForEmail(fromEmail: string): Promise<string> {
        const normalizedEmail = fromEmail.toLowerCase().trim();
        
        // Obtener credenciales para este email
        const credentials = this.getCredentialsForEmail(normalizedEmail);
        if (!credentials) {
            throw new Error(`No hay credenciales configuradas para ${fromEmail}. Debes configurar las variables de entorno correspondientes.`);
        }

        // Buscar si ya tenemos un token para este email
        let tokenData = this.tokenDataMap.get(normalizedEmail);

        // Si no existe, inicializar
        if (!tokenData) {
            this.logger.log(`[GET_ACCESS_TOKEN] Inicializando token para ${normalizedEmail}`);
            tokenData = {
                access_token: '',
                refresh_token: credentials.refreshToken,
                expires_in: 0,
                token_type: 'Bearer',
                api_domain: envs.zohoApiDomain || 'https://mail.zoho.com',
                expires_at: 0,
            };
            this.tokenDataMap.set(normalizedEmail, tokenData);
        }

        // Si el token expira en menos de 5 minutos o ya expiró, refrescarlo
        const bufferTime = 5 * 60 * 1000; // 5 minutos
        if (Date.now() + bufferTime >= tokenData.expires_at) {
            this.logger.debug(`[GET_ACCESS_TOKEN] Token próximo a expirar para ${normalizedEmail}, refrescando...`);
            return await this.refreshAccessTokenForEmail(normalizedEmail, credentials);
        }

        this.logger.debug(`[GET_ACCESS_TOKEN] Token válido para ${normalizedEmail}`);
        return tokenData.access_token;
    }

    /**
     * Obtiene el dominio API de Zoho
     */
    getApiDomain(): string {
        if (envs.zohoApiDomain) {
            return envs.zohoApiDomain;
        }
        // Retornar el dominio del primer token disponible, o el por defecto
        const firstToken = this.tokenDataMap.values().next().value as ZohoTokenData | undefined;
        return firstToken?.api_domain || 'https://mail.zoho.com';
    }

    /**
     * Verifica si hay un token disponible
     */
    hasToken(): boolean {
        return this.tokenDataMap.size > 0 || 
               !!envs.zohoRefreshToken || 
               !!envs.zohoRefreshTokenNoreply || 
               !!envs.zohoRefreshTokenPrivacity;
    }

    /**
     * Programa la renovación automática del access token para un email
     */
    private scheduleTokenRefresh(email: string, credentials: ZohoCredentials) {
        // Limpiar el intervalo anterior si existe
        const existingInterval = this.refreshIntervalIds.get(email);
        if (existingInterval) {
            clearTimeout(existingInterval);
            this.refreshIntervalIds.delete(email);
        }

        const tokenData = this.tokenDataMap.get(email);
        if (!tokenData) {
            this.logger.warn(`[SCHEDULE_REFRESH] No hay tokenData disponible para ${email}`);
            return;
        }

        // Calcular cuándo debe renovarse el token (10 minutos antes de expirar)
        const bufferTime = 10 * 60 * 1000; // 10 minutos
        const timeUntilRefresh = tokenData.expires_at - Date.now() - bufferTime;

        // Si el tiempo es negativo o muy pequeño, renovar inmediatamente
        if (timeUntilRefresh <= 0) {
            this.logger.log(`[SCHEDULE_REFRESH] ⚡ Token próximo a expirar para ${email}, renovando inmediatamente...`);
            this.refreshAccessTokenForEmail(email, credentials)
                .then(() => {
                    this.logger.log(`[SCHEDULE_REFRESH] ✅ Token renovado inmediatamente para ${email}`);
                    this.scheduleTokenRefresh(email, credentials); // Volver a programar
                })
                .catch((error) => {
                    const msg = error instanceof Error ? error.message : String(error);
                    this.logger.error(`[SCHEDULE_REFRESH_ERROR] ❌ Error al renovar token para ${email}: ${msg}`);
                    // Reintentar en 1 minuto
                    const retryTimeout = setTimeout(() => this.scheduleTokenRefresh(email, credentials), 60 * 1000);
                    this.refreshIntervalIds.set(email, retryTimeout);
                });
            return;
        }

        const minutesUntilRefresh = Math.floor(timeUntilRefresh / 1000 / 60);
        this.logger.log(`[SCHEDULE_REFRESH] ⏰ Próxima renovación para ${email} en ${minutesUntilRefresh} minutos`);

        // Programar la renovación
        const intervalId = setTimeout(async () => {
            this.logger.log(`[AUTO_REFRESH] 🔄 Iniciando renovación automática del token para ${email}...`);
            try {
                await this.refreshAccessTokenForEmail(email, credentials);
                this.logger.log(`[AUTO_REFRESH] ✅ Token renovado automáticamente para ${email}`);
                // Volver a programar la siguiente renovación
                this.scheduleTokenRefresh(email, credentials);
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[AUTO_REFRESH_ERROR] ❌ Error al renovar token para ${email}: ${msg}`);
                // Reintentar en 1 minuto
                const retryTimeout = setTimeout(() => this.scheduleTokenRefresh(email, credentials), 60 * 1000);
                this.refreshIntervalIds.set(email, retryTimeout);
            }
        }, timeUntilRefresh);

        this.refreshIntervalIds.set(email, intervalId);
    }

    /**
     * Limpia los temporizadores de renovación automática
     */
    onModuleDestroy() {
        this.refreshIntervalIds.forEach((intervalId, email) => {
            clearTimeout(intervalId);
            this.logger.log(`[CLEANUP] Temporizador de renovación limpiado para ${email}`);
        });
        this.refreshIntervalIds.clear();
    }
}
