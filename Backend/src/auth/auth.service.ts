import { 
    BadRequestException, 
    Injectable, 
    UnauthorizedException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service'; // Asegura la ruta correcta
import { RegisterDto } from './dto/register.dto'; // Importación necesaria para el método register
import { LoginDto } from './dto/login.dto'; // Importación necesaria para el método login
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Prisma } from '@prisma/client';
import { EmailVerificationService } from '../users/email-verification/email-verification.service';
import { VerifyRegisterDto } from './dto/verify-register.dto';
import { ResendRegisterDto } from './dto/resend-register.dto';

// Interfaz para el Payload del JWT
interface JwtPayload {
    id: string; 
    email: string;
}

const OWNER_ROLE_ID = 2n;
const CUSTOMER_ROLE_ID = 4n;
const TOKEN_TTL_MINUTES = 10; // Debe coincidir con el TTL de verificación por correo
const TOKEN_LENGTH = 6;

type VerificationSnapshot = {
    correo_verificado?: boolean;
    correo_verificado_en?: Date | null;
    sms_verificado?: boolean;
    sms_verificado_en?: Date | null;
    credencial_verificada?: boolean;
    credencial_verificada_en?: Date | null;
    avatar_url?: string | null;
    credential_url?: string | null;
    numero_cuenta?: string | null;
    edad?: number | null;
};

type PreRegSessionPayload = {
    kind: 'preReg';
    email: string;
    name: string;
    passwordHash: string;
    roleId: string; // BigInt serialized
    accountNumber: string | null;
    age: number | null;
    code: string; // 6 dígitos
    expAt: number; // epoch ms
    iat?: number;
    exp?: number;
};

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService, 
        private readonly jwtService: JwtService,
        private readonly emailVerificationService: EmailVerificationService,
    ) {}

    // --- (C)reate - REGISTER API ---
    async register(registerDto: RegisterDto) {
        // 1. Verificar si el usuario ya existe (no debemos crear todavía)
        const existingUser = await this.prisma.usuarios.findUnique({
            where: { correo_electronico: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('El usuario ya existe con ese correo.');
        }

        const normalizedAccountNumber = registerDto.accountNumber?.trim();
        const normalizedAge = registerDto.age ?? null;

        // 2. Hashear la contraseña (guardaremos el hash en la sesión firmada)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(registerDto.password, salt);

        // 3. Determinar rol objetivo según flujo (negocio vs cliente)
        const requestedRole = registerDto.role ?? 'usuario';
        const roleId = requestedRole === 'admin' ? OWNER_ROLE_ID : CUSTOMER_ROLE_ID;

        // 4. Generar código y enviar correo de verificación (sin tocar DB)
        const code = this.generateNumericToken();
        const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
        await this.emailVerificationService.sendVerificationCodeEmail({
            to: registerDto.email,
            name: registerDto.name,
            code,
            expiresAt,
        });

        // 5. Firmar una sesión de verificación con los datos de registro
        const sessionPayload = {
            kind: 'preReg' as const,
            email: registerDto.email,
            name: registerDto.name,
            passwordHash: hashedPassword,
            roleId: roleId.toString(),
            accountNumber: normalizedAccountNumber ?? null,
            age: normalizedAge,
            code,
            expAt: expiresAt.getTime(),
        };

        const session = this.jwtService.sign(sessionPayload, { expiresIn: `${TOKEN_TTL_MINUTES}m` });

        return {
            requiresVerification: true,
            delivery: 'email' as const,
            expiresAt: expiresAt.toISOString(),
            session,
        };
    }

    // --- (R)ead - LOGIN API (Corregido y Actualizado) ---
    async login(loginDto: LoginDto) { 
        
        // 1. Buscar usuario por 'correo_electronico'
        const user = await this.prisma.usuarios.findUnique({ 
            where: { correo_electronico: loginDto.correo_electronico },
            select: {
                id_usuario: true,
                correo_electronico: true,
                password_hash: true,
                correo_verificado: true,
                correo_verificado_en: true,
                sms_verificado: true,
                sms_verificado_en: true,
                credencial_verificada: true,
                credencial_verificada_en: true,
                avatar_url: true,
                credential_url: true,
                numero_cuenta: true,
                edad: true,
            },
        });
        
        // Si no se encuentra el usuario
        if (!user) {
            // Se usa la excepción importada
            throw new UnauthorizedException('Credenciales inválidas (Correo no encontrado).');
        }

        // 2. Comparar la contraseña ingresada con el hash de la DB
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash); 
        
        // Si la contraseña no coincide
        if (!isPasswordValid) {
            // Se usa la excepción importada
            throw new UnauthorizedException('Credenciales inválidas (Contraseña incorrecta).');
        }

        // 3. Generar y devolver el Token JWT
        const payload: JwtPayload = { 
            id: user.id_usuario.toString(), 
            email: user.correo_electronico 
        };
        
    return this.generateToken(payload, user);
    }

    async verifyAccount(dto: VerifyEmailDto) {
        const token = dto.token?.trim();
        if (!token) {
            throw new BadRequestException('Token de verificación inválido.');
        }

        const result = await this.emailVerificationService.verifyByToken(token);

        const payload: JwtPayload = {
            id: result.updated.id_usuario.toString(),
            email: result.updated.correo_electronico,
        };

        const authPayload = this.generateToken(payload, result.updated);

        return {
            message: result.alreadyVerified ? 'La cuenta ya estaba verificada.' : 'Cuenta verificada correctamente.',
            verifiedAt: result.verifiedAt,
            ...authPayload,
        };
    }

    async verifyRegister(dto: VerifyRegisterDto) {
        const code = dto.code?.trim();
        const session = dto.session?.trim();
        if (!code || code.length !== TOKEN_LENGTH || !/^\d{6}$/.test(code)) {
            throw new BadRequestException('El código debe contener 6 dígitos.');
        }
        if (!session) {
            throw new BadRequestException('Sesión de verificación inválida.');
        }

        let payload: PreRegSessionPayload;
        try {
            payload = this.jwtService.verify<PreRegSessionPayload>(session);
        } catch {
            throw new UnauthorizedException('La sesión de verificación expiró o no es válida.');
        }

        if (payload?.kind !== 'preReg') {
            throw new BadRequestException('Sesión de verificación no válida.');
        }

        if (payload.code !== code) {
            throw new BadRequestException('El código ingresado es incorrecto.');
        }

        if (typeof payload.expAt === 'number' && Date.now() > payload.expAt) {
            throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
        }

        // Verificar si el correo aún no existe
        const existingUser = await this.prisma.usuarios.findUnique({
            where: { correo_electronico: payload.email },
            select: { id_usuario: true },
        });
        if (existingUser) {
            throw new ConflictException('El correo ya está registrado.');
        }

        // Validar rol
        const roleId = BigInt(payload.roleId);
        const desiredRole = await this.prisma.roles.findUnique({ where: { id_rol: roleId } });
        if (!desiredRole) {
            throw new BadRequestException('Rol no válido para el usuario.');
        }

        // Crear usuario con correo verificado
        try {
            const now = new Date();
            const user = await this.prisma.usuarios.create({
                data: {
                    nombre: payload.name,
                    correo_electronico: payload.email,
                    password_hash: payload.passwordHash,
                    correo_verificado: true,
                    correo_verificado_en: now,
                    sms_verificado: false,
                    credencial_verificada: false,
                    fecha_registro: now,
                    id_rol: desiredRole.id_rol,
                    ...(payload.accountNumber ? { numero_cuenta: payload.accountNumber } : {}),
                    ...(payload.age !== undefined && payload.age !== null ? { edad: Number(payload.age) } : {}),
                },
            });

            // Enviar correo de documentos legales
            try {
                await this.emailVerificationService.sendLegalDocumentsEmail({
                    to: user.correo_electronico,
                    name: user.nombre,
                });
            } catch (legalError) {
                const reason = legalError instanceof Error ? legalError.message : String(legalError);
                this.logger.warn(`[LEGAL_EMAIL_FAILED] userId=${user.id_usuario.toString()} reason=${reason}`);
            }

            // Generar token de autenticación
            const jwtPayload: JwtPayload = {
                id: user.id_usuario.toString(),
                email: user.correo_electronico,
            };
            return this.generateToken(jwtPayload, user);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('El correo o número de cuenta ya se encuentra registrado.');
            }
            const message = error instanceof Error ? `${error.name}: ${error.message}` : 'Error desconocido al crear usuario';
            this.logger.error(`[USER_CREATE_AFTER_VERIFY_ERROR] ${message}`);
            throw new BadRequestException('No se pudo crear el usuario después de verificar el código.');
        }
    }

    async resendRegister(dto: ResendRegisterDto) {
        const session = dto.session?.trim();
        if (!session) {
            throw new BadRequestException('Sesión de verificación inválida.');
        }
        let payload: PreRegSessionPayload;
        try {
            payload = this.jwtService.verify<PreRegSessionPayload>(session);
        } catch {
            throw new UnauthorizedException('La sesión de verificación expiró o no es válida.');
        }
        if (payload?.kind !== 'preReg') {
            throw new BadRequestException('Sesión de verificación no válida.');
        }

        // Generar un nuevo código y reenviar
        const code = this.generateNumericToken();
        const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
        await this.emailVerificationService.sendVerificationCodeEmail({
            to: payload.email,
            name: payload.name,
            code,
            expiresAt,
        });

        // Emitir una nueva sesión con el código actualizado
        const newSessionPayload: PreRegSessionPayload = {
            ...payload,
            code,
            expAt: expiresAt.getTime(),
        };
        const newSession = this.jwtService.sign(newSessionPayload, { expiresIn: `${TOKEN_TTL_MINUTES}m` });
        return {
            delivery: 'email' as const,
            expiresAt: expiresAt.toISOString(),
            session: newSession,
        };
    }
    
    // Función auxiliar para generar el token
    private generateToken(
        payload: JwtPayload,
        user?: VerificationSnapshot,
    ) {
        const token = this.jwtService.sign(payload);
        const emailVerified = user?.correo_verificado ?? false;
        const smsVerified = user?.sms_verificado ?? false;
        const credentialVerified = user?.credencial_verificada ?? false;
        return { 
            token, 
            user: { 
                id: payload.id, 
                email: payload.email,
                verified: emailVerified,
                verifications: {
                    email: emailVerified,
                    sms: smsVerified,
                    credential: credentialVerified,
                },
                verificationTimestamps: {
                    email: user?.correo_verificado_en ? user.correo_verificado_en.toISOString() : null,
                    sms: user?.sms_verificado_en ? user.sms_verificado_en.toISOString() : null,
                    credential: user?.credencial_verificada_en ? user.credencial_verificada_en.toISOString() : null,
                },
                avatarUrl: user?.avatar_url ?? null,
                credentialUrl: user?.credential_url ?? null,
                accountNumber: user?.numero_cuenta ?? null,
                age: user?.edad ?? null,
            } 
        };
    }

    private generateNumericToken(): string {
        const random = Math.floor(Math.random() * Math.pow(10, TOKEN_LENGTH));
        return random.toString().padStart(TOKEN_LENGTH, '0');
    }
}