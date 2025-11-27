import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto'; 
import * as bcrypt from 'bcrypt'; // Necesario si permites cambiar la contraseña
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { EmailVerificationService } from './email-verification/email-verification.service';

@Injectable()
export class UsersService {
    private readonly TOKEN_TTL_MINUTES = 10;
    private readonly TOKEN_LENGTH = 6;

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private emailVerificationService: EmailVerificationService,
    ) {}

  // --- R (Read) - Obtener por ID ---
  // Útil para que el controlador pueda obtener el perfil completo si es necesario.
  async findOne(id: bigint) {
        const user = await this.prisma.usuarios.findUnique({
            where: { id_usuario: id },
            select: {
                id_usuario: true,
                nombre: true,
                correo_electronico: true,
                numero_telefono: true,
                id_rol: true,
                numero_cuenta: true,
                edad: true,
                avatar_url: true,
                credential_url: true,
                correo_verificado: true,
                correo_verificado_en: true,
                sms_verificado: true,
                sms_verificado_en: true,
                credencial_verificada: true,
                credencial_verificada_en: true,
            },
        });
    if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
    }
        return this.serializeUser(user);
  }

  // --- U (Update) - Actualizar Perfil ---
  async update(id: bigint, updateUserDto: UpdateUserDto) {
    const dataToUpdate: any = {};
    
    // 1. Manejar campos normales (nombre, teléfono)
        if (updateUserDto.name !== undefined) {
            const trimmed = updateUserDto.name?.trim();
            if (trimmed && trimmed.length > 0) {
                dataToUpdate.nombre = trimmed;
            }
        }
        if (updateUserDto.phoneNumber !== undefined) {
            const trimmed = updateUserDto.phoneNumber?.trim();
            dataToUpdate.numero_telefono = trimmed && trimmed.length > 0 ? trimmed : null;
        }
        if (updateUserDto.avatarUrl !== undefined) {
            dataToUpdate.avatar_url = updateUserDto.avatarUrl ?? null;
        }
        if (updateUserDto.credentialUrl !== undefined) {
            dataToUpdate.credential_url = updateUserDto.credentialUrl ?? null;
        }

        if (updateUserDto.accountNumber !== undefined) {
      const trimmed = updateUserDto.accountNumber?.trim();
      dataToUpdate.numero_cuenta = trimmed && trimmed.length > 0 ? trimmed : null;
    }

        if (updateUserDto.email !== undefined) {
            dataToUpdate.correo_electronico = updateUserDto.email?.trim().toLowerCase() ?? null;
        }

    if (updateUserDto.age !== undefined) {
      dataToUpdate.edad = updateUserDto.age ?? null;
    }

    // 2. Manejar la contraseña (si se proporciona, debe hashearse)
    if (updateUserDto.newPassword) {
        const salt = await bcrypt.genSalt(10);
        dataToUpdate.password_hash = await bcrypt.hash(updateUserDto.newPassword, salt);
    }

    try {
            const updated = await this.prisma.usuarios.update({
                where: { id_usuario: id },
                data: dataToUpdate,
                select: {
                    id_usuario: true,
                    nombre: true,
                    correo_electronico: true,
                    numero_telefono: true,
                    id_rol: true,
                    numero_cuenta: true,
                    edad: true,
                    avatar_url: true,
                    credential_url: true,
                    correo_verificado: true,
                    correo_verificado_en: true,
                    sms_verificado: true,
                    sms_verificado_en: true,
                    credencial_verificada: true,
                    credencial_verificada_en: true,
                },
            });
            return this.serializeUser(updated);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('Usuario no encontrado.');
                }
                if (error.code === 'P2002') {
                    throw new ConflictException('El correo o número de cuenta ya pertenece a otro usuario.');
                }
            }
            throw error;
        }
  }

    // --- (P)repare - Request a profile update with verification ---
    async requestProfileUpdate(id: bigint, updateUserDto: UpdateUserDto) {
        // 1. Fetch current user
        const user = await this.prisma.usuarios.findUnique({ where: { id_usuario: id } });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado.');
        }

        // If the update includes an email change, ensure it's not already used
        if (updateUserDto.email && updateUserDto.email.trim().toLowerCase() !== user.correo_electronico) {
            const existing = await this.prisma.usuarios.findUnique({ where: { correo_electronico: updateUserDto.email.trim().toLowerCase() } });
            if (existing) {
                throw new ConflictException('El correo ya está en uso por otro usuario.');
            }
        }

        // Build session payload
        const code = this.generateNumericToken();
        const expiresAt = new Date(Date.now() + this.TOKEN_TTL_MINUTES * 60 * 1000);

        // Copy incoming fields into payload in consistent names
        const updates: any = {};
        if (updateUserDto.name !== undefined) updates.name = updateUserDto.name?.trim() ?? null;
        if (updateUserDto.phoneNumber !== undefined) updates.phoneNumber = updateUserDto.phoneNumber?.trim() ?? null;
        if (updateUserDto.avatarUrl !== undefined) updates.avatarUrl = updateUserDto.avatarUrl ?? null;
        if (updateUserDto.credentialUrl !== undefined) updates.credentialUrl = updateUserDto.credentialUrl ?? null;
        if (updateUserDto.accountNumber !== undefined) updates.accountNumber = updateUserDto.accountNumber?.trim() ?? null;
        if (updateUserDto.age !== undefined) updates.age = updateUserDto.age ?? null;
        if (updateUserDto.email !== undefined) updates.email = updateUserDto.email?.trim().toLowerCase() ?? null;

        if (updateUserDto.newPassword) {
            const salt = await bcrypt.genSalt(10);
            updates.passwordHash = await bcrypt.hash(updateUserDto.newPassword, salt);
        }

        // Create the session payload
        const sessionPayload = {
            kind: 'preProfileUpdate' as const,
            userId: id.toString(),
            updates,
            code,
            expAt: expiresAt.getTime(),
        };

        const session = this.jwtService.sign(sessionPayload, { expiresIn: `${this.TOKEN_TTL_MINUTES}m` });

        // Determine recipient: if pending email provided, send to that, else send to current
        const recipientEmail = updates.email ?? user.correo_electronico;
        await this.emailVerificationService.sendVerificationCodeEmail({
            to: recipientEmail,
            name: user.nombre,
            code,
            expiresAt,
        });

        return {
            message: 'Código enviado a correo electrónico. Ingresa el código para confirmar los cambios.',
            delivery: 'email' as const,
            expiresAt: expiresAt.toISOString(),
            session,
        };
    }

    // --- (V)erify - confirm profile update (apply changes) ---
    async verifyProfileUpdate(dto: { session: string; code: string }, actorId?: bigint) {
        if (!dto.session) throw new BadRequestException('Sesión inválida.');
        if (!dto.code || dto.code.length !== this.TOKEN_LENGTH || !/^[0-9]{6}$/.test(dto.code)) {
            throw new BadRequestException('Código inválido.');
        }

        let payload: any;
        try {
            payload = this.jwtService.verify(dto.session);
        } catch (err) {
            throw new BadRequestException('Sesión inválida o expiró.');
        }

        if (payload?.kind !== 'preProfileUpdate') {
            throw new BadRequestException('Sesión no corresponde a una actualización de perfil.');
        }

        if (payload.code !== dto.code) {
            throw new BadRequestException('Código incorrecto.');
        }

        if (typeof payload.expAt === 'number' && Date.now() > payload.expAt) {
            throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
        }

        // Apply update using the payload.updates
        const userId = BigInt(payload.userId);
        // Si el actor (quien solicita confirmar) no es el dueño del session payload, denegar
        if (actorId !== undefined && actorId !== userId) {
            throw new BadRequestException('No tienes permiso para confirmar esta actualización.');
        }
        const updates = payload.updates ?? {};

        // If email provided, ensure it's not in use (double-check to avoid race)
        if (updates.email) {
            const existing = await this.prisma.usuarios.findUnique({ where: { correo_electronico: updates.email } });
            if (existing && existing.id_usuario !== userId) {
                throw new ConflictException('El correo proporcionado ya pertenece a otro usuario.');
            }
        }

        // Prepare 'dataToUpdate' like update() logic, but accept passwordHash prepared
        const dataToUpdate: any = {};
        if (updates.name !== undefined) dataToUpdate.nombre = updates.name ?? null;
        if (updates.phoneNumber !== undefined) dataToUpdate.numero_telefono = updates.phoneNumber ?? null;
        if (updates.avatarUrl !== undefined) dataToUpdate.avatar_url = updates.avatarUrl ?? null;
        if (updates.credentialUrl !== undefined) dataToUpdate.credential_url = updates.credentialUrl ?? null;
        if (updates.accountNumber !== undefined) dataToUpdate.numero_cuenta = updates.accountNumber ?? null;
        if (updates.age !== undefined) dataToUpdate.edad = updates.age ?? null;
        if (updates.email !== undefined) {
            dataToUpdate.correo_electronico = updates.email ?? null;
            // If email is updated via verification, mark as verified
            dataToUpdate.correo_verificado = true;
            dataToUpdate.correo_verificado_en = new Date();
        }
        if (updates.passwordHash) dataToUpdate.password_hash = updates.passwordHash;

        try {
            const updated = await this.prisma.usuarios.update({
                where: { id_usuario: userId },
                data: dataToUpdate,
                select: {
                    id_usuario: true,
                    nombre: true,
                    correo_electronico: true,
                    numero_telefono: true,
                    id_rol: true,
                    numero_cuenta: true,
                    edad: true,
                    avatar_url: true,
                    credential_url: true,
                    correo_verificado: true,
                    correo_verificado_en: true,
                    sms_verificado: true,
                    sms_verificado_en: true,
                    credencial_verificada: true,
                    credencial_verificada_en: true,
                },
            });
            return this.serializeUser(updated);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') throw new NotFoundException('Usuario no encontrado.');
                if (error.code === 'P2002') throw new ConflictException('El correo o número de cuenta ya pertenece a otro usuario.');
            }
            throw error;
        }
    }

  // --- D (Delete) - Eliminar Cuenta ---
  async delete(id: bigint) {
    try {
            await this.prisma.usuarios.delete({
                where: { id_usuario: id },
            });
            return { message: 'Cuenta eliminada exitosamente' };
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new NotFoundException('Usuario no encontrado para eliminar.');
            }
            throw error;
        }
  }

    private serializeUser(user: any) {
        const emailVerified = user?.correo_verificado ?? false;
        const smsVerified = user?.sms_verificado ?? false;
        const credentialVerified = user?.credencial_verificada ?? false;
        return {
            id: user.id_usuario.toString(),
            name: user.nombre,
            email: user.correo_electronico,
            phoneNumber: user.numero_telefono ?? null,
            roleId: user.id_rol ? user.id_rol.toString() : null,
            accountNumber: user.numero_cuenta ?? null,
            age: user.edad ?? null,
            avatarUrl: user.avatar_url ?? null,
            credentialUrl: user.credential_url ?? null,
            verified: emailVerified,
            verifiedAt: user.correo_verificado_en ? user.correo_verificado_en.toISOString() : null,
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
        };
    }

    private generateNumericToken(): string {
            const random = Math.floor(Math.random() * Math.pow(10, this.TOKEN_LENGTH));
            return random.toString().padStart(this.TOKEN_LENGTH, '0');
    }
}