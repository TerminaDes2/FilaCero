import { Body, Controller, Post, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from 'src/common/dto';
import { maskSendEmailDto } from 'src/common/logging.utils';

@Controller('api/email')
export class EmailController {
    constructor(
        private readonly emailService: EmailService
    ) {}

    @Post('send')
    sendEmail(
        @Body() sendEmailDto: SendEmailDto
    ) {
        const logger = new Logger(EmailController.name);
        logger.debug('[INCOMING_REQUEST] /api/email/send dtoMasked=' + JSON.stringify(maskSendEmailDto(sendEmailDto)));
        return this.emailService.sendEmail(sendEmailDto);
    }
}
