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
        const { smtpConfig, mailOptions } = job.data;
        this.logger.debug(`[JOB_START] id=${job.id} attemptsMade=${job.attemptsMade}/${job.opts.attempts} dataMasked=${JSON.stringify(maskSendEmailDto(job.data))}`);

        const sanitizedHtml: string = sanitizeHtml(mailOptions.html, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'header', 'footer', 'section', 'article',
                'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'strong', 'em', 'b', 'i', 'u',
                'ul', 'ol', 'li', 'br', 'hr', 'blockquote', 'pre', 'code', 'sub', 'sup',
            ]), // Usar etiquetas por defecto de sanitize-html y añadir más
            allowedAttributes: {
                '*': ['style', 'class', 'id', 'align', 'valign'], // Permitir atributos comunes en cualquier etiqueta
                'a': ['href', 'target', 'rel'], // Atributos específicos para enlaces
                'img': ['src', 'alt', 'width', 'height', 'border'], // Atributos para imágenes
                'table': ['border', 'cellpadding', 'cellspacing', 'width'], // Atributos para tablas
                'td': ['colspan', 'rowspan'], // Atributos para celdas
            },
            allowedStyles: {
                '*': {
                    // Ser más permisivo con los estilos
                    'background': [/.*/], // Permitir cualquier valor de background
                    'background-color': [/.*/], // Cualquier color
                    'color': [/.*/], // Cualquier color
                    'font': [/.*/], // Permitir cualquier combinación de fuente
                    'font-family': [/.*/], // Cualquier familia de fuentes
                    'font-size': [/.*/], // Cualquier tamaño (px, em, rem, etc.)
                    'font-weight': [/.*/], // Cualquier peso (bold, normal, 700, etc.)
                    'font-style': [/.*/], // Cualquier estilo (italic, normal, etc.)
                    'padding': [/.*/], // Cualquier valor de padding
                    'margin': [/.*/], // Cualquier valor de margin
                    'text-align': [/.*/], // Cualquier alineación
                    'text-decoration': [/.*/], // Cualquier decoración
                    'display': [/.*/], // Cualquier valor de display
                    'width': [/.*/], // Cualquier ancho
                    'height': [/.*/], // Cualquier alto
                    'max-width': [/.*/], // Cualquier ancho máximo
                    'max-height': [/.*/], // Cualquier alto máximo
                    'border': [/.*/], // Cualquier borde
                    'border-radius': [/.*/], // Cualquier radio
                    'box-shadow': [/.*/], // Cualquier sombra
                    'line-height': [/.*/], // Altura de línea
                    'letter-spacing': [/.*/], // Espaciado de letras
                    'vertical-align': [/.*/], // Alineación vertical
                },
            },
            allowedClasses: {
                '*': [/.*/], // Permitir cualquier clase en cualquier etiqueta
            },
            // Permitir iframes y otros contenidos embebidos si es necesario (opcional)
            allowedIframeHostnames: [], // Dejar vacío para no permitir iframes por ahora
            // Bloquear explícitamente scripts y contenido peligroso
            disallowedTagsMode: 'discard', // Descarta etiquetas no permitidas como <script>
        });
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