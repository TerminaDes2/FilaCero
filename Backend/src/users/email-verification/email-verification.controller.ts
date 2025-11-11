import { Body, Controller, Logger, Post } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { SendVerificationDto } from '../dto/send-verification.dto';

@Controller('api/usuarios')
export class EmailVerificationController {
    private readonly logger = new Logger(EmailVerificationController.name);

    constructor(private readonly emailVerificationService: EmailVerificationService) {}

    @Post('enviar-verificacion')
    async send(@Body() dto: SendVerificationDto) {
        this.logger.debug(`[EMAIL_VERIFICATION_SEND] email=${dto.correo_electronico}`);
        const result = await this.emailVerificationService.resend(dto.correo_electronico);
        return {
            message: 'Código de verificación enviado.',
            delivery: result.delivery,
            expiresAt: result.expiresAt,
        };
    }

    @Post('verificar-correo')
    async verify(@Body() dto: VerifyEmailDto) {
        this.logger.debug(`[EMAIL_VERIFICATION_VERIFY] email=${dto.correo_electronico}`);
        return this.emailVerificationService.verifyCode(dto.correo_electronico, dto.codigo);
    }
}
