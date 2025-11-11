import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { MailOptions, SendEmailDto, SmtpConfig } from '../../common/dto';

const TOKEN_LENGTH = 6;
const TOKEN_TTL_MINUTES = 10;
const MAX_TOKEN_ATTEMPTS = 5;

const DEFAULT_SMTP = {
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    secure: false,
    auth: {
        user: '68e473cea8ae78',
        pass: '3cef6368c8be3a',
    } as const,
    from: 'equipofilacero@filacero.store',
};

const verificationSelect = {
    id_usuario: true,
    correo_electronico: true,
    nombre: true,
    correo_verificado: true,
    correo_verificado_en: true,
    verification_token: true,
    verification_token_expires: true,
    sms_verificado: true,
    sms_verificado_en: true,
    credencial_verificada: true,
    credencial_verificada_en: true,
    avatar_url: true,
    credential_url: true,
    numero_cuenta: true,
    edad: true,
} satisfies Prisma.usuariosSelect;

type VerificationRecord = Prisma.usuariosGetPayload<{ select: typeof verificationSelect }>;

type IssueResult = {
    delivery: 'email';
    expiresAt: string;
};

type VerificationResult = {
    updated: VerificationRecord;
    verifiedAt: string;
    alreadyVerified: boolean;
};

@Injectable()
export class EmailVerificationService {
    private readonly logger = new Logger(EmailVerificationService.name);
    private readonly ttlMs = TOKEN_TTL_MINUTES * 60 * 1000;

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
        private readonly configService: ConfigService,
    ) {}

    async issue(email: string): Promise<IssueResult> {
        const normalizedEmail = this.normalizeEmail(email);
        const user = await this.prisma.usuarios.findUnique({
            where: { correo_electronico: normalizedEmail },
            select: {
                id_usuario: true,
                correo_electronico: true,
                nombre: true,
                correo_verificado: true,
            },
        });

        if (!user) {
            throw new NotFoundException('No se encontró un usuario con ese correo electrónico.');
        }

        if (user.correo_verificado) {
            throw new BadRequestException('El correo electrónico ya está verificado.');
        }

        const tokenData = await this.assignUniqueCode(user.id_usuario);
        await this.enqueueEmail({
            to: user.correo_electronico,
            name: user.nombre,
            code: tokenData.code,
            expiresAt: tokenData.expiresAt,
        });

        this.logger.log(
            `[VERIFICATION_CODE_SENT] userId=${user.id_usuario.toString()} email=${user.correo_electronico} expiresAt=${tokenData.expiresAt.toISOString()}`,
        );

        return {
            delivery: 'email',
            expiresAt: tokenData.expiresAt.toISOString(),
        };
    }

    async verifyCode(email: string, code: string) {
        const normalizedEmail = this.normalizeEmail(email);
        const sanitizedCode = this.normalizeCode(code);

        const user = await this.prisma.usuarios.findUnique({
            where: { correo_electronico: normalizedEmail },
            select: verificationSelect,
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (user.correo_verificado) {
            return this.buildAlreadyVerifiedResponse(user);
        }

        this.assertTokenMatches(user, sanitizedCode);
        const result = await this.completeVerification(user.id_usuario);

        return {
            message: 'Correo verificado correctamente.',
            verifiedAt: result.verifiedAt,
            user: this.mapToResponseUser(result.updated),
        };
    }

    async verifyByToken(token: string): Promise<VerificationResult> {
        const sanitizedToken = this.normalizeCode(token);
        const user = await this.prisma.usuarios.findUnique({
            where: { verification_token: sanitizedToken },
            select: verificationSelect,
        });

        if (!user) {
            throw new NotFoundException('Token de verificación no válido o ya utilizado.');
        }

        if (user.correo_verificado) {
            const verifiedAt = (user.correo_verificado_en ?? new Date()).toISOString();
            return {
                updated: user,
                verifiedAt,
                alreadyVerified: true,
            };
        }

        this.assertTokenMatches(user, sanitizedToken);
        return {
            ...await this.completeVerification(user.id_usuario),
            alreadyVerified: false,
        };
    }

    async resend(email: string): Promise<IssueResult> {
        return this.issue(email);
    }

    private normalizeEmail(email: string): string {
        return email?.trim().toLowerCase();
    }

    private normalizeCode(code: string): string {
        const value = code?.trim();
        if (!value || value.length !== TOKEN_LENGTH || !/^\d{6}$/.test(value)) {
            throw new BadRequestException('El código debe contener 6 dígitos.');
        }
        return value;
    }

    private async assignUniqueCode(userId: bigint): Promise<{ code: string; expiresAt: Date }> {
        for (let attempt = 1; attempt <= MAX_TOKEN_ATTEMPTS; attempt++) {
            const code = this.generateNumericToken();
            const expiresAt = new Date(Date.now() + this.ttlMs);
            try {
                await this.prisma.usuarios.update({
                    where: { id_usuario: userId },
                    data: {
                        verification_token: code,
                        verification_token_expires: expiresAt,
                    },
                });
                return { code, expiresAt };
            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                    this.logger.warn(`[VERIFICATION_CODE_COLLISION] userId=${userId.toString()} attempt=${attempt}`);
                    continue;
                }
                throw error;
            }
        }
        throw new InternalServerErrorException('No se pudo generar un código de verificación único. Intenta nuevamente.');
    }

    private async completeVerification(userId: bigint): Promise<Omit<VerificationResult, 'alreadyVerified'>> {
        const now = new Date();
        const updated = await this.prisma.usuarios.update({
            where: { id_usuario: userId },
            data: {
                correo_verificado: true,
                correo_verificado_en: now,
                verification_token: null,
                verification_token_expires: null,
            },
            select: verificationSelect,
        });

        const verifiedAt = (updated.correo_verificado_en ?? now).toISOString();
        return { updated, verifiedAt };
    }

    private assertTokenMatches(user: VerificationRecord, providedCode: string) {
        if (!user.verification_token || !user.verification_token_expires) {
            throw new BadRequestException('No hay un código de verificación activo. Solicita uno nuevo.');
        }

        if (user.verification_token !== providedCode) {
            throw new BadRequestException('El código ingresado es incorrecto.');
        }

        if (user.verification_token_expires.getTime() < Date.now()) {
            throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
        }
    }

    private async enqueueEmail(params: { to: string; name?: string | null; code: string; expiresAt: Date }) {
        const smtpConfig = this.resolveSmtpConfig();
        const mailOptions = this.buildMailOptions(params);

        const dto: SendEmailDto = {
            smtpConfig,
            mailOptions,
        };

        await this.emailService.sendEmail(dto);
    }

    private resolveSmtpConfig(): SmtpConfig {
        const host = this.configService.get<string>('SMTP_HOST') ?? DEFAULT_SMTP.host;
        const portRaw = this.configService.get<string>('SMTP_PORT');
        const secureRaw = this.configService.get<string>('SMTP_SECURE');
        const user = this.configService.get<string>('SMTP_USER') ?? DEFAULT_SMTP.auth.user;
        const pass = this.configService.get<string>('SMTP_PASS') ?? DEFAULT_SMTP.auth.pass;

        const port = portRaw ? Number(portRaw) : DEFAULT_SMTP.port;
        if (Number.isNaN(port)) {
            throw new InternalServerErrorException('SMTP_PORT debe ser un número válido.');
        }

        const secure = typeof secureRaw === 'string'
            ? ['true', '1', 'yes'].includes(secureRaw.toLowerCase())
            : DEFAULT_SMTP.secure;

        const config: SmtpConfig = {
            host,
            port,
            secure,
            auth: user && pass ? { user, pass } : undefined,
        };

        return config;
    }

    private buildMailOptions(params: { to: string; name?: string | null; code: string; expiresAt: Date }): MailOptions {
    const fromEnv = this.configService.get<string>('MAIL_FROM');
    const from = fromEnv ?? `FilaCero <${DEFAULT_SMTP.from}>`;
        const friendlyName = this.sanitizeDisplayName(params.name);
        const expiresInMinutes = Math.round((params.expiresAt.getTime() - Date.now()) / 60000);
        const humanizedExpiration = expiresInMinutes <= 1 ? '1 minuto' : `${expiresInMinutes} minutos`;

        const html = `
            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
                <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Hola ${friendlyName},</p>
                <p style="margin: 0 0 16px; font-size: 16px; color: #111827;">Gracias por crear tu cuenta en <strong>FilaCero</strong>. Tu código de verificación es:</p>
                <div style="margin: 24px 0; text-align: center;">
                    <span style="display: inline-block; background: #111827; color: #ffffff; letter-spacing: 6px; font-size: 28px; font-weight: 600; padding: 16px 24px; border-radius: 12px;">${params.code}</span>
                </div>
                <p style="margin: 0 0 12px; font-size: 15px; color: #374151;">Ingresa este código en la pantalla de verificación antes de <strong>${humanizedExpiration}</strong>.</p>
                <p style="margin: 0 0 20px; font-size: 15px; color: #6B7280;">Si no solicitaste esta verificación puedes ignorar este correo.</p>
                <p style="margin: 32px 0 0; font-size: 14px; color: #9CA3AF;">— Equipo FilaCero</p>
            </div>
        `;

        const text = `Hola ${friendlyName}, tu código de verificación de FilaCero es ${params.code}. Expira en ${humanizedExpiration}.`;

        return {
            from,
            to: params.to,
            subject: 'Tu código de verificación - FilaCero',
            html,
            text,
        };
    }

    private mapToResponseUser(user: VerificationRecord) {
        const emailVerified = user.correo_verificado ?? false;
        const smsVerified = user.sms_verificado ?? false;
        const credentialVerified = user.credencial_verificada ?? false;

        return {
            id: user.id_usuario.toString(),
            email: user.correo_electronico,
            verified: emailVerified,
            verifications: {
                email: emailVerified,
                sms: smsVerified,
                credential: credentialVerified,
            },
            verificationTimestamps: {
                email: user.correo_verificado_en ? user.correo_verificado_en.toISOString() : null,
                sms: user.sms_verificado_en ? user.sms_verificado_en.toISOString() : null,
                credential: user.credencial_verificada_en ? user.credencial_verificada_en.toISOString() : null,
            },
            avatarUrl: user.avatar_url ?? null,
            credentialUrl: user.credential_url ?? null,
            accountNumber: user.numero_cuenta ?? null,
            age: user.edad ?? null,
        };
    }

    private buildAlreadyVerifiedResponse(user: VerificationRecord) {
        return {
            message: 'El correo ya estaba verificado.',
            verifiedAt: (user.correo_verificado_en ?? new Date()).toISOString(),
            user: this.mapToResponseUser(user),
        };
    }

    private sanitizeDisplayName(name?: string | null): string {
        if (!name) {
            return 'allá';
        }
        const trimmed = name.trim();
        if (!trimmed) {
            return 'allá';
        }
        const withoutAngles = trimmed.replace(/[<>]/g, '');
        return withoutAngles.split(' ')[0];
    }

    private generateNumericToken(): string {
        const random = Math.floor(Math.random() * Math.pow(10, TOKEN_LENGTH));
        return random.toString().padStart(TOKEN_LENGTH, '0');
    }
}
