import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { envs } from 'src/config';
import * as fs from 'fs';
import * as path from 'path';

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
    private readonly tokenFilePath = path.join(process.cwd(), 'zoho-token.json');

    async onModuleInit() {
        if (!envs.mailUseHttp) {
            this.logger.log('[INIT] MAIL_USE_HTTP=false, OAuth no requerido');
            return;
        }

        this.validateConfig();
        await this.loadTokenFromFile();

        if (!this.tokenData) {
            this.logger.warn('[INIT] No hay token disponible. Debes autorizar la aplicación primero visitando /api/email/auth');
        } else {
            this.logger.log('[INIT] Token OAuth cargado correctamente');
        }
    }

    private validateConfig() {
        if (!envs.zohoClientId || !envs.zohoClientSecret || !envs.zohoRedirectUri) {
            throw new Error('Faltan variables de entorno: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REDIRECT_URI');
        }
    }

    /**
     * Obtiene la URL de autorización para el flujo OAuth
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
     */
    async exchangeCodeForTokens(code: string): Promise<ZohoTokenData> {
        this.logger.log('[EXCHANGE_CODE] Intercambiando código por tokens');

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

            await this.saveTokenToFile();
            this.logger.log('[EXCHANGE_CODE_SUCCESS] Tokens obtenidos y guardados');

            return this.tokenData;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[EXCHANGE_CODE_EXCEPTION] ${msg}`);
            throw error;
        }
    }

    /**
     * Refresca el access token usando el refresh token
     */
    async refreshAccessToken(): Promise<string> {
        if (!this.tokenData?.refresh_token) {
            throw new Error('No hay refresh_token disponible. Debes autorizar la aplicación primero.');
        }

        this.logger.log('[REFRESH_TOKEN] Refrescando access token');

        if (!envs.zohoClientId || !envs.zohoClientSecret) {
            throw new Error('Faltan credenciales de Zoho OAuth');
        }

        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: envs.zohoClientId as string,
            client_secret: envs.zohoClientSecret as string,
            refresh_token: this.tokenData.refresh_token,
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

            this.tokenData = {
                ...this.tokenData,
                access_token: data.access_token,
                expires_in: data.expires_in,
                expires_at: Date.now() + data.expires_in * 1000,
            };

            await this.saveTokenToFile();
            this.logger.log('[REFRESH_TOKEN_SUCCESS] Access token refrescado');

            return this.tokenData.access_token;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[REFRESH_TOKEN_EXCEPTION] ${msg}`);
            throw error;
        }
    }

    /**
     * Obtiene un access token válido (refresca automáticamente si ha expirado)
     */
    async getValidAccessToken(): Promise<string> {
        if (!this.tokenData) {
            throw new Error('No hay token disponible. Debes autorizar la aplicación primero visitando /api/email/auth');
        }

        // Si el token expira en menos de 5 minutos, refrescarlo
        const bufferTime = 5 * 60 * 1000; // 5 minutos
        if (Date.now() + bufferTime >= this.tokenData.expires_at) {
            this.logger.debug('[GET_TOKEN] Token próximo a expirar, refrescando');
            return await this.refreshAccessToken();
        }

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
     * Guarda los tokens en un archivo local
     */
    private async saveTokenToFile(): Promise<void> {
        try {
            await fs.promises.writeFile(
                this.tokenFilePath,
                JSON.stringify(this.tokenData, null, 2),
                'utf-8'
            );
            this.logger.debug(`[SAVE_TOKEN] Tokens guardados en ${this.tokenFilePath}`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[SAVE_TOKEN_ERROR] ${msg}`);
        }
    }

    /**
     * Carga los tokens desde un archivo local
     */
    private async loadTokenFromFile(): Promise<void> {
        try {
            if (fs.existsSync(this.tokenFilePath)) {
                const data = await fs.promises.readFile(this.tokenFilePath, 'utf-8');
                this.tokenData = JSON.parse(data) as ZohoTokenData;
                this.logger.debug(`[LOAD_TOKEN] Tokens cargados desde ${this.tokenFilePath}`);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.warn(`[LOAD_TOKEN_ERROR] ${msg}`);
        }
    }

    /**
     * Verifica si hay un token disponible
     */
    hasToken(): boolean {
        return this.tokenData !== null;
    }
}
