import { Request } from 'express';
import { Body, Controller, Post, Logger, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from 'src/common/dto';
import { maskSendEmailDto } from 'src/common/logging.utils';
import { ZohoOAuthService } from './zoho-oauth.service';
import { Response } from 'express';

@Controller('api/email')
export class EmailController {
    private readonly logger = new Logger(EmailController.name);

    constructor(
        private readonly emailService: EmailService,
        private readonly zohoOAuthService: ZohoOAuthService,
    ) { }

    @Post('send')
    sendEmail(
        @Body() sendEmailDto: SendEmailDto
    ) {
        this.logger.debug('[INCOMING_REQUEST] /api/email/send dtoMasked=' + JSON.stringify(maskSendEmailDto(sendEmailDto)));
        return this.emailService.sendEmail(sendEmailDto);
    }

    /**
     * Inicia el flujo OAuth de Zoho
     * El usuario debe visitar esta URL para autorizar la aplicación
     */
    @Get('auth')
    initiateOAuth(@Res() res: Response): void {
        try {
            const authUrl = this.zohoOAuthService.getAuthorizationUrl();
            this.logger.log('[OAUTH_INIT] Redirigiendo a Zoho para autorización');
            res.redirect(authUrl);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[OAUTH_INIT_ERROR] ${msg}`);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: 'Error al iniciar OAuth',
                message: msg,
            });
        }
    }

    /**
     * Callback de Zoho OAuth después de que el usuario autoriza
     */
    @Get('auth/callback')
    async handleOAuthCallback(
        @Query('code') code: string,
        @Query('error') error: string,
        @Res() res: Response,
    ): Promise<void> {
        if (error) {
            this.logger.error(`[OAUTH_CALLBACK_ERROR] ${error}`);
            res.status(HttpStatus.BAD_REQUEST).json({
                error: 'Error en autorización',
                message: error,
            });
            return;
        }

        if (!code) {
            this.logger.error('[OAUTH_CALLBACK_ERROR] Falta código de autorización');
            res.status(HttpStatus.BAD_REQUEST).json({
                error: 'Falta código de autorización',
            });
            return;
        }

        try {
            this.logger.log('[OAUTH_CALLBACK] Procesando código de autorización');
            const tokenData = await this.zohoOAuthService.exchangeCodeForTokens(code);

            this.logger.log('[OAUTH_CALLBACK_SUCCESS] Autorización completada');
            res.status(HttpStatus.OK).json({
                message: 'Autorización exitosa. La aplicación ahora puede enviar emails vía Zoho.',
                tokenData: {
                    expires_in: tokenData.expires_in,
                    api_domain: tokenData.api_domain,
                },
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`[OAUTH_CALLBACK_EXCEPTION] ${msg}`);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: 'Error al procesar autorización',
                message: msg,
            });
        }
    }

    /**
     * Verifica el estado de la autorización OAuth
     */
    @Get('auth/status')
    checkAuthStatus() {
        const hasToken = this.zohoOAuthService.hasToken();
        return {
            authorized: hasToken,
            message: hasToken
                ? 'La aplicación está autorizada para enviar emails vía Zoho'
                : 'La aplicación no está autorizada. Visita /api/email/auth para autorizar',
        };
    }
}
