import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { envs } from 'src/config';

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
export class ZohoOAuthService implements OnModuleInit {
    private readonly logger = new Logger(ZohoOAuthService.name);
    private tokenData: ZohoTokenData | null = null;

    async onModuleInit() {
        if (!envs.mailUseHttp) {
            this.logger.log('[INIT] MAIL_USE_HTTP=false, OAuth no requerido');
            return;
        }

        this.validateConfig();

        // Si existe ZOHO_REFRESH_TOKEN en las variables de entorno, lo usamos
        if (envs.zohoRefreshToken) {
            this.logger.log('[INIT] ZOHO_REFRESH_TOKEN encontrado, inicializando con refresh token desde variables de entorno');
            this.tokenData = {
                access_token: '',
                refresh_token: envs.zohoRefreshToken,
                expires_in: 0,
                token_type: 'Bearer',
                api_domain: envs.zohoApiDomain || 'https://mail.zoho.com',
                expires_at: 0, // Forzará un refresh inmediato
            };
            
            try {
                // Obtener el primer access_token usando el refresh_token
                await this.refreshAccessToken();
                this.logger.log('[INIT] ✅ Access token obtenido exitosamente usando ZOHO_REFRESH_TOKEN');
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                this.logger.error(`[INIT] ❌ Error al obtener access token con refresh token: ${msg}`);
                this.logger.warn('[INIT] Es posible que necesites reautorizar la aplicación visitando /api/email/auth');
            }
        } else {
            this.logger.warn('[INIT] ⚠️  No hay ZOHO_REFRESH_TOKEN disponible.');
            this.logger.warn('[INIT] Debes autorizar la aplicación visitando /api/email/auth para obtener el refresh token.');
            this.logger.warn('[INIT] Una vez obtenido, cópialo de los logs y agrégalo a ZOHO_REFRESH_TOKEN en tus variables de entorno.');
        }
    }

    private validateConfig() {
        if (!envs.zohoClientId || !envs.zohoClientSecret || !envs.zohoRedirectUri) {
            throw new Error('Faltan variables de entorno: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REDIRECT_URI');
        }
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
    async exchangeCodeForTokens(code: string): Promise<ZohoTokenData> {
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

            this.tokenData = {
                access_token: data.access_token,
                refresh_token: data.refresh_token,
                expires_in: data.expires_in,
                token_type: data.token_type,
                api_domain: data.api_domain || 'https://mail.zoho.com',
                expires_at: Date.now() + data.expires_in * 1000,
            };

            // ⭐ IMPORTANTE: Imprimir el refresh_token en consola para copiarlo desde Railway
            this.logger.log('╔════════════════════════════════════════════════════════════════════════════╗');
            this.logger.log('║  🎉 REFRESH TOKEN OBTENIDO - COPIA ESTO A TU VARIABLE DE ENTORNO         ║');
            this.logger.log('╠════════════════════════════════════════════════════════════════════════════╣');
            console.log(`\n🔑 ZOHO_REFRESH_TOKEN=${data.refresh_token}\n`);
            this.logger.log('╠════════════════════════════════════════════════════════════════════════════╣');
            this.logger.log('║  📝 Instrucciones:                                                         ║');
            this.logger.log('║  1. Copia el token anterior                                                ║');
            this.logger.log('║  2. Agrégalo a tus variables de entorno en Railway como:                   ║');
            this.logger.log('║     ZOHO_REFRESH_TOKEN=<el_token_copiado>                                  ║');
            this.logger.log('║  3. Reinicia la aplicación                                                 ║');
            this.logger.log('║  4. A partir de ahora, el access_token se regenerará automáticamente       ║');
            this.logger.log('╚════════════════════════════════════════════════════════════════════════════╝');

            this.logger.log('[EXCHANGE_CODE_SUCCESS] ✅ Tokens obtenidos correctamente');

            return this.tokenData;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[EXCHANGE_CODE_EXCEPTION] ${msg}`);
            throw error;
        }
    }

    /**
     * Refresca el access token usando el refresh token
     * Usa ZOHO_REFRESH_TOKEN de las variables de entorno si está disponible
     */
    async refreshAccessToken(): Promise<string> {
        // Priorizar el refresh_token de las variables de entorno
        const refreshToken = envs.zohoRefreshToken || this.tokenData?.refresh_token;

        if (!refreshToken) {
            throw new Error('No hay refresh_token disponible. Debes autorizar la aplicación primero visitando /api/email/auth');
        }

        this.logger.log('[REFRESH_TOKEN] 🔄 Refrescando access token...');

        if (!envs.zohoClientId || !envs.zohoClientSecret) {
            throw new Error('Faltan credenciales de Zoho OAuth');
        }

        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: envs.zohoClientId as string,
            client_secret: envs.zohoClientSecret as string,
            refresh_token: refreshToken,
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
                throw new Error(`Error al refrescar token: ${response.status} ${errorText}`);
            }

            const data = await response.json() as ZohoTokenResponse;

            if (!data.access_token) {
                throw new Error('Respuesta inválida de Zoho: falta access_token');
            }

            // Actualizar o crear tokenData
            if (!this.tokenData) {
                this.tokenData = {
                    access_token: data.access_token,
                    refresh_token: refreshToken,
                    expires_in: data.expires_in,
                    token_type: data.token_type,
                    api_domain: data.api_domain || envs.zohoApiDomain || 'https://mail.zoho.com',
                    expires_at: Date.now() + data.expires_in * 1000,
                };
            } else {
                this.tokenData = {
                    ...this.tokenData,
                    access_token: data.access_token,
                    expires_in: data.expires_in,
                    expires_at: Date.now() + data.expires_in * 1000,
                };
            }

            this.logger.log('[REFRESH_TOKEN_SUCCESS] ✅ Access token refrescado correctamente');
            this.logger.debug(`[REFRESH_TOKEN] Nuevo token expira en ${data.expires_in} segundos`);

            return this.tokenData.access_token;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[REFRESH_TOKEN_EXCEPTION] ${msg}`);
            throw error;
        }
    }

    /**
     * Obtiene un access token válido (refresca automáticamente si ha expirado)
     * Esta es la función principal que debes usar para obtener tokens
     */
    async getAccessToken(): Promise<string> {
        // Si existe ZOHO_REFRESH_TOKEN pero no se ha inicializado tokenData
        if (envs.zohoRefreshToken && !this.tokenData) {
            this.logger.log('[GET_ACCESS_TOKEN] Inicializando con ZOHO_REFRESH_TOKEN de variables de entorno');
            this.tokenData = {
                access_token: '',
                refresh_token: envs.zohoRefreshToken,
                expires_in: 0,
                token_type: 'Bearer',
                api_domain: envs.zohoApiDomain || 'https://mail.zoho.com',
                expires_at: 0,
            };
        }

        if (!this.tokenData) {
            throw new Error('No hay token disponible. Debes autorizar la aplicación primero visitando /api/email/auth');
        }

        // Si el token expira en menos de 5 minutos o ya expiró, refrescarlo
        const bufferTime = 5 * 60 * 1000; // 5 minutos
        if (Date.now() + bufferTime >= this.tokenData.expires_at) {
            this.logger.debug('[GET_ACCESS_TOKEN] Token próximo a expirar o ya expirado, refrescando...');
            return await this.refreshAccessToken();
        }

        this.logger.debug('[GET_ACCESS_TOKEN] Token válido, retornando token existente');
        return this.tokenData.access_token;
    }

    /**
     * Obtiene el dominio API de Zoho
     */
    getApiDomain(): string {
        if (envs.zohoApiDomain) {
            return envs.zohoApiDomain;
        }
        return this.tokenData?.api_domain || 'https://mail.zoho.com';
    }

    /**
     * Verifica si hay un token disponible (ya sea en memoria o en variables de entorno)
     */
    hasToken(): boolean {
        return this.tokenData !== null || !!envs.zohoRefreshToken;
    }

    /**
     * Obtiene el refresh token actual (útil para debugging)
     */
    getRefreshToken(): string | null {
        return envs.zohoRefreshToken || this.tokenData?.refresh_token || null;
    }
}
