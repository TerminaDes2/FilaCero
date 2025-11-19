import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ZohoOAuthService } from './zoho-oauth.service';

export interface ZohoMailOptions {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
}

interface ZohoEmailPayload {
    fromAddress: string;
    toAddress: string;
    subject: string;
    content: string;
    mailFormat: 'html' | 'plaintext';
}

export interface ZohoSendResponse {
    status: {
        code: number;
        description: string;
    };
    data: {
        messageId?: string;
    };
}

interface ZohoAccountData {
    accountId: string;
    accountName?: string;
    [key: string]: unknown;
}

interface ZohoAccountsResponse {
    status?: {
        code: number;
        description: string;
    };
    data?: ZohoAccountData[];
}

@Injectable()
export class ZohoHttpService {
    private readonly logger = new Logger(ZohoHttpService.name);

    constructor(private readonly zohoOAuthService: ZohoOAuthService) {}

    /**
     * Envía un email usando la API HTTP de Zoho Mail
     */
    async sendEmail(mailOptions: ZohoMailOptions): Promise<ZohoSendResponse> {
        // Validaciones de entrada
        this.validateMailOptions(mailOptions);

        this.logger.debug(`[SEND_EMAIL] to=${mailOptions.to} subject=${mailOptions.subject}`);

        try {
            // Obtener token válido (refresca automáticamente si es necesario)
            const accessToken = await this.zohoOAuthService.getValidAccessToken();
            const apiDomain = this.zohoOAuthService.getApiDomain();

            // Obtener accountId (necesario para enviar emails)
            const accountId = await this.getAccountId(accessToken, apiDomain);

            // Extraer emails puros (pueden venir como "Name <email>" o "email")
            const fromEmail = this.extractEmail(mailOptions.from);
            const toEmail = this.extractEmail(mailOptions.to);

            // Preparar payload según la API de Zoho
            const payload: ZohoEmailPayload = {
                fromAddress: fromEmail,
                toAddress: toEmail,
                subject: mailOptions.subject,
                content: mailOptions.html || mailOptions.text || '',
                mailFormat: mailOptions.html ? 'html' : 'plaintext',
            };

            // Enviar email
            const url = `${apiDomain}/api/accounts/${accountId}/messages`;
            this.logger.debug(`[ZOHO_API_CALL] POST ${url} from=${fromEmail} to=${toEmail}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json() as Partial<ZohoSendResponse>;

            // Manejo de respuestas de error de Zoho
            if (!response.ok) {
                this.logger.error(`[ZOHO_API_ERROR] ${response.status}: ${JSON.stringify(responseData)}`);
                
                // Si es 401, el token podría haber expirado (aunque ya refrescamos)
                if (response.status === 401) {
                    throw new Error('Token de acceso inválido o expirado. Reautoriza la aplicación.');
                }
                
                // Otros errores 4xx
                if (response.status >= 400 && response.status < 500) {
                    throw new BadRequestException(
                        responseData?.status?.description || 
                        `Error de validación: ${response.status}`
                    );
                }
                
                // Errores 5xx
                if (response.status >= 500) {
                    throw new Error(`Error del servidor de Zoho: ${response.status}`);
                }

                throw new Error(`Error al enviar email: ${response.status} ${JSON.stringify(responseData)}`);
            }

            this.logger.log(`[ZOHO_EMAIL_SENT] messageId=${responseData?.data?.messageId ?? 'unknown'} status=${responseData?.status?.code ?? response.status}`);

            return responseData as ZohoSendResponse;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`[SEND_EMAIL_ERROR] ${msg}`, stack);
            throw error;
        }
    }

    /**
     * Obtiene el accountId de la cuenta de Zoho Mail
     */
    private async getAccountId(accessToken: string, apiDomain: string): Promise<string> {
        this.logger.debug('[GET_ACCOUNT_ID] Obteniendo accountId');

        try {
            const url = `${apiDomain}/api/accounts`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Zoho-oauthtoken ${accessToken}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`[GET_ACCOUNT_ID_ERROR] ${response.status}: ${errorText}`);
                throw new Error(`Error al obtener accountId: ${response.status}`);
            }

            const data = await response.json() as ZohoAccountsResponse;

            // La API devuelve un array de cuentas
            if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
                const accountId = data.data[0].accountId;
                if (!accountId) {
                    throw new Error('La cuenta de Zoho no tiene accountId');
                }
                this.logger.debug(`[GET_ACCOUNT_ID_SUCCESS] accountId=${accountId}`);
                return accountId;
            }

            throw new Error('No se encontraron cuentas de Zoho Mail');
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[GET_ACCOUNT_ID_EXCEPTION] ${msg}`);
            throw error;
        }
    }

    /**
     * Valida las opciones del correo
     */
    private validateMailOptions(mailOptions: ZohoMailOptions): void {
        if (!mailOptions.to || !mailOptions.to.trim()) {
            throw new BadRequestException('El campo "to" es requerido');
        }

        if (!mailOptions.subject || !mailOptions.subject.trim()) {
            throw new BadRequestException('El campo "subject" es requerido');
        }

        if (!mailOptions.html && !mailOptions.text) {
            throw new BadRequestException('Debe proporcionar "html" o "text"');
        }

        if (!mailOptions.from || !mailOptions.from.trim()) {
            throw new BadRequestException('El campo "from" es requerido');
        }

        // Validación básica de formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        // Extraer email puro de "to" (puede venir como "Name <email>" o "email")
        const toEmail = this.extractEmail(mailOptions.to);
        if (!emailRegex.test(toEmail)) {
            throw new BadRequestException('El formato del email "to" es inválido');
        }

        // Extraer email puro de "from" (puede venir como "Name <email>" o "email")
        const fromEmail = this.extractEmail(mailOptions.from);
        if (!emailRegex.test(fromEmail)) {
            throw new BadRequestException('El formato del email "from" es inválido');
        }
    }

    /**
     * Extrae el email de un string que puede tener formato "Name <email@domain.com>" o "email@domain.com"
     */
    private extractEmail(emailString: string): string {
        // Regex para extraer email de formato "Name <email@domain.com>"
        const match = emailString.match(/<([^>]+)>/);
        return match ? match[1] : emailString.trim();
    }
}
