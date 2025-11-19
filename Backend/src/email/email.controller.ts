import { Body, Controller, Post, Get, Req, Logger } from '@nestjs/common';
import { Request } from 'express';
import { EmailService } from './email.service';
import { SendEmailDto } from 'src/common/dto';
import { maskSendEmailDto } from 'src/common/logging.utils';

@Controller('api/email')
export class EmailController {
    private readonly logger = new Logger(EmailController.name);

    constructor(
        private readonly emailService: EmailService
    ) {}

    @Get('auth')
    async zohoAuthCallback(@Req() req: Request) {
        const { code, error } = req.query;
        
        // Log detallado del callback de Zoho OAuth
        this.logger.log(`[${new Date().toISOString()}] Callback recibido en /api/email/auth`);
        this.logger.log(`URL completa: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
        this.logger.log(`Query params completos: ${JSON.stringify(req.query)}`);

        if (code) {
            this.logger.log(`✓ Authorization code recibido: ${code}`);
        } else if (error) {
            this.logger.error(`✗ Error recibido desde Zoho: ${error}`);
        } else {
            this.logger.warn('⚠ No se recibió authorization code ni error');
        }

        return { 
            message: 'Callback procesado',
            timestamp: new Date().toISOString(),
            receivedCode: !!code,
            receivedError: !!error
        };
    }

    @Post('send')
    sendEmail(
        @Body() sendEmailDto: SendEmailDto
    ) {
        this.logger.debug('[INCOMING_REQUEST] /api/email/send dtoMasked=' + JSON.stringify(maskSendEmailDto(sendEmailDto)));
        return this.emailService.sendEmail(sendEmailDto);
    }
}
