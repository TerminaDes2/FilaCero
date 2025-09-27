import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from '../auth/dto/update-user.dto'; 
import * as bcrypt from 'bcryptjs'; // Necesario si permites cambiar la contraseña

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // --- R (Read) - Obtener por ID ---
  // Útil para que el controlador pueda obtener el perfil completo si es necesario.
  async findOne(id: bigint) {
    const user = await this.prisma.usuarios.findUnique({ 
        where: { id_usuario: id },
        // Excluir la contraseña al leer el perfil
        select: { id_usuario: true, nombre: true, correo_electronico: true, numero_telefono: true, id_rol: true }
    });
    if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
    }
    return user;
  }

  // --- U (Update) - Actualizar Perfil ---
  async update(id: bigint, updateUserDto: UpdateUserDto) {
    const dataToUpdate: any = {};
    
    // 1. Manejar campos normales (nombre, teléfono)
    if (updateUserDto.name) {
        dataToUpdate.nombre = updateUserDto.name;
    }
    if (updateUserDto.phoneNumber) {
        dataToUpdate.numero_telefono = updateUserDto.phoneNumber;
    }

    // 2. Manejar la contraseña (si se proporciona, debe hashearse)
    if (updateUserDto.newPassword) {
        const salt = await bcrypt.genSalt(10);
        dataToUpdate.password_hash = await bcrypt.hash(updateUserDto.newPassword, salt);
    }

    try {
        return await this.prisma.usuarios.update({
            where: { id_usuario: id },
            data: dataToUpdate,
            select: { id_usuario: true, nombre: true, correo_electronico: true },
        });
    } catch (error) {
        // Manejar errores de Prisma si el ID no existe
        throw new NotFoundException('Usuario no encontrado o error de actualización.');
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
        // Manejar errores de Prisma si el ID no existe
        throw new NotFoundException('Usuario no encontrado para eliminar.');
    }
  }
}