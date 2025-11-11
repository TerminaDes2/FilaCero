import { 
    BadRequestException, 
    Injectable, 
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service'; // Asegura la ruta correcta
import { RegisterDto } from './dto/register.dto'; // Importación necesaria para el método register
import { LoginDto } from './dto/login.dto'; // Importación necesaria para el método login
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Prisma } from '@prisma/client';
import { EmailVerificationService } from '../users/email-verification/email-verification.service';

// Interfaz para el Payload del JWT
interface JwtPayload {
    id: string; 
    email: string;
}

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

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService, 
        private readonly jwtService: JwtService,
        private readonly emailVerificationService: EmailVerificationService,
    ) {}

    // --- (C)reate - REGISTER API ---
    async register(registerDto: RegisterDto) {
        // 1. Verificar si el usuario ya existe
        const existingUser = await this.prisma.usuarios.findUnique({
            where: { correo_electronico: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('El usuario ya existe con ese correo.');
        }

        const normalizedAccountNumber = registerDto.accountNumber?.trim();
        const normalizedAge = registerDto.age ?? null;

        // 2. Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(registerDto.password, salt);

        // 3. Crear y guardar en la base de datos
        try {
            // Determinar rol solicitado (admin/usuario) o usar 'usuario' por defecto
            const desiredRoleName = registerDto.role ?? 'usuario';
            const desiredRole = await this.prisma.roles.findUnique({ where: { nombre_rol: desiredRoleName } });

            const user = await this.prisma.usuarios.create({
                data: {
                    nombre: registerDto.name,
                    correo_electronico: registerDto.email,
                    password_hash: hashedPassword,
                    correo_verificado: false,
                    sms_verificado: false,
                    credencial_verificada: false,
                    fecha_registro: new Date(),
                    ...(desiredRole ? { id_rol: desiredRole.id_rol } : {}),
                    ...(normalizedAccountNumber ? { numero_cuenta: normalizedAccountNumber } : {}),
                    ...(normalizedAge !== null ? { edad: normalizedAge } : {}),
                },
            });

            let verificationMeta: { delivery: 'email'; expiresAt: string };
            try {
                verificationMeta = await this.emailVerificationService.issue(user.correo_electronico);
            } catch (issueError) {
                await this.prisma.usuarios.delete({ where: { id_usuario: user.id_usuario } }).catch(() => undefined);
                throw issueError;
            }

            // 4. Generar Token JWT
            const payload: JwtPayload = { 
                id: user.id_usuario.toString(), 
                email: user.correo_electronico 
            };

            const authResponse = this.generateToken(payload, user);
            return {
                ...authResponse,
                requiresVerification: true,
                verification: verificationMeta,
            };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('El correo o número de cuenta ya se encuentra registrado.');
            }
            console.error(error);
            throw new BadRequestException('Error al crear el usuario. Revise los datos.');
        }
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
}