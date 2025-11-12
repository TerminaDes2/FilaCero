import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';

describe('EmailVerificationService', () => {
    let service: EmailVerificationService;
    interface PrismaMock {
        usuarios: {
            findUnique: jest.Mock;
            update: jest.Mock;
        };
    }

    interface EmailServiceMock {
        sendEmail: jest.Mock;
    }

    interface ConfigServiceMock {
        get: jest.Mock;
    }

    let prisma: PrismaMock;
    let emailService: EmailServiceMock;
    let configService: ConfigServiceMock;

    beforeEach(() => {
        prisma = {
            usuarios: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
        };

        emailService = {
            sendEmail: jest.fn(),
        };

        configService = {
            get: jest.fn((key: string) => {
                switch (key) {
                    case 'SMTP_HOST':
                        return 'smtp.test.local';
                    case 'SMTP_PORT':
                        return '587';
                    case 'SMTP_SECURE':
                        return 'false';
                    case 'SMTP_USER':
                        return 'user';
                    case 'SMTP_PASS':
                        return 'pass';
                    case 'MAIL_FROM':
                        return 'FilaCero <no-reply@test.local>';
                    default:
                        return undefined;
                }
            }),
        };

        service = new EmailVerificationService(
            prisma as unknown as PrismaService,
            emailService as unknown as EmailService,
            configService as unknown as ConfigService,
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('verifies a code successfully for a simulated user', async () => {
        const userId = BigInt(42);
        const email = 'cliente.demo@example.com';
        const code = '123456';
        const now = new Date();
        const pendingUser = {
            id_usuario: userId,
            correo_electronico: email,
            nombre: 'Cliente Demo',
            correo_verificado: false,
            correo_verificado_en: null,
            verification_token: code,
            verification_token_expires: new Date(now.getTime() + 5 * 60000),
            sms_verificado: false,
            sms_verificado_en: null,
            credencial_verificada: false,
            credencial_verificada_en: null,
            avatar_url: null,
            credential_url: null,
            numero_cuenta: null,
            edad: null,
        };

        prisma.usuarios.findUnique.mockResolvedValueOnce(pendingUser);

        const verifiedAt = new Date(now.getTime() + 1000);
        const updatedUser = {
            ...pendingUser,
            correo_verificado: true,
            correo_verificado_en: verifiedAt,
            verification_token: null,
            verification_token_expires: null,
        };
        prisma.usuarios.update.mockResolvedValueOnce(updatedUser);

        const result = await service.verifyCode(email, code);

        expect(result.message).toBe('Correo verificado correctamente.');
        expect(result.verifiedAt).toBe(verifiedAt.toISOString());
        expect(result.user.verified).toBe(true);
        expect(result.user.id).toBe(userId.toString());
        expect(result.user.email).toBe(email);
    });
});
