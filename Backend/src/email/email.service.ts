import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { SendEmailDto } from 'src/common/dto';
import { maskSendEmailDto } from 'src/common/logging.utils';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(
        @InjectQueue('email-queue') private readonly emailQueue: Queue
    ) {}

    async sendEmail(sendEmailDto: SendEmailDto) {
        const { smtpConfig, mailOptions } = sendEmailDto;
        this.logger.debug('[QUEUE_ADD] email-queue/send-email payloadMasked=' + JSON.stringify(maskSendEmailDto(sendEmailDto)));

        try {
            const job = await this.emailQueue.add(
                'send-email',
                { smtpConfig, mailOptions },
                {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                }
            );
            this.logger.log(`[QUEUE_ENQUEUED] jobId=${job.id} attempts=${job.opts.attempts}`);
            return { message: 'Email encolado correctamente', jobId: job.id };
        } catch (error: unknown) {
            let msg: string;
            let stack: string | undefined;
            if (error instanceof Error) {
                msg = `${error.name}: ${error.message}`;
                stack = error.stack;
            } else {
                try {
                    msg = JSON.stringify(error);
                } catch {
                    if (typeof error === 'string') {
                        msg = error;
                    } else {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        msg = Object.prototype.toString.call(error);
                    }
                }
            }
            this.logger.error('[QUEUE_ADD_ERROR] ' + msg, stack);
            throw new Error(`Error al enviar el correo desde el Service: ${msg}`);
        }
    }
}