import { OnQueueActive, OnQueueCompleted, OnQueueFailed, OnQueueError, Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { SendEmailDto } from "src/common/dto";
import sanitizeHtml from 'sanitize-html';
import { createTransporter } from "src/config/nodemailer"
import { Logger } from "@nestjs/common";
import { maskSendEmailDto } from "src/common/logging.utils";

@Processor('email-queue')
export class EmailProcessor {
    private readonly logger = new Logger(EmailProcessor.name);
    
    @Process('send-email')
    async handleSendEmail(job: Job<SendEmailDto>) {
        const {smtpConfig, mailOptions} = job.data;
        this.logger.debug(`[JOB_START] id=${job.id} attemptsMade=${job.attemptsMade}/${job.opts.attempts} dataMasked=${JSON.stringify(maskSendEmailDto(job.data))}`);

    const sanitizedHtml: string = sanitizeHtml(mailOptions.html || '');
        const transporter = createTransporter(smtpConfig);
        try {
            this.logger.debug(`[SMTP_VERIFY] id=${job.id} host=${smtpConfig.host} port=${smtpConfig.port} secure=${Boolean(smtpConfig.secure)}`);
            try {
                transporter.verify()
                    .then((ok: boolean) => this.logger.debug(`[SMTP_VERIFY_OK] id=${job.id} ok=${ok}`))
                    .catch((e: unknown) => this.logger.debug(`[SMTP_VERIFY_SKIP] id=${job.id} reason=${e instanceof Error ? e.message : safeStringify(e)}`));
            } catch (verifyErr) {
                this.logger.debug(`[SMTP_VERIFY_EXCEPTION] id=${job.id} reason=${verifyErr instanceof Error ? verifyErr.message : safeStringify(verifyErr)}`);
            }

            await job.progress(25);
            this.logger.debug(`[SMTP_SENDING] id=${job.id} to=${mailOptions.to} subject=${mailOptions.subject} htmlLen=${(mailOptions.html || '').length}`);
            const info = await transporter.sendMail({
                ...mailOptions,
                html: sanitizedHtml,
            });
            await job.progress(100);
            this.logger.log(`[SMTP_SENT] id=${job.id} messageId=${info?.messageId} accepted=${JSON.stringify(info?.accepted)} rejected=${JSON.stringify(info?.rejected)} response=${info?.response}`);
            return info;
        } catch (error: unknown) {
            const msg = error instanceof Error ? `${error.name}: ${error.message}` : safeStringify(error);
            const stack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`[JOB_ERROR] id=${job.id} ${msg}`, stack);
            throw new Error(`Error al enviar el correo desde el Processor: ${msg}`);
        }
    }

    @OnQueueActive()
    onActive(job: Job) {
        this.logger.debug(`[QUEUE_ACTIVE] id=${job.id} name=${job.name}`);
    }

    @OnQueueCompleted()
    onCompleted(job: Job, result: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        this.logger.log(`[QUEUE_COMPLETED] id=${job.id} result=${safeStringify(result)}`);
    }

    @OnQueueFailed()
    onFailed(job: Job, err: Error) {
        this.logger.error(`[QUEUE_FAILED] id=${job.id} error=${err.name}: ${err.message}`, err.stack);
    }

    @OnQueueError()
    onError(err: Error) {
        this.logger.error(`[QUEUE_ERROR] ${err.name}: ${err.message}`, err.stack);
    }
}

function safeStringify(value: unknown): string {
    try {
        return typeof value === 'string' ? value : JSON.stringify(value);
    } catch {
        // Fallback simple sin exponer estructuras internas
        return '[unstringifiable]';
    }
}