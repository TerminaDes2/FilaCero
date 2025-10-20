import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from '../auth/dto/update-user.dto'; 
import * as bcrypt from 'bcrypt'; // Necesario si permites cambiar la contraseña
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
                verificado: true,
                fecha_verificacion: true,
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
                    verificado: true,
                    fecha_verificacion: true,
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

    private serializeUser(user: {
        id_usuario: bigint;
        nombre: string;
        correo_electronico: string;
        numero_telefono: string | null;
        id_rol: bigint | null;
        numero_cuenta: string | null;
        edad: number | null;
        avatar_url: string | null;
        credential_url: string | null;
        verificado: boolean;
        fecha_verificacion: Date | null;
    }) {
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
            verified: user.verificado,
            verifiedAt: user.fecha_verificacion ? user.fecha_verificacion.toISOString() : null,
        };
    }
}