import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos los empleados de un negocio específico
   */
  async findAllByBusiness(businessId: bigint) {
    const employees = await this.prisma.empleados.findMany({
      where: { negocio_id: businessId },
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            correo_electronico: true,
            numero_telefono: true,
            avatar_url: true,
            fecha_registro: true,
          },
        },
      },
      orderBy: { fecha_alta: 'desc' },
    });

    return employees.map(emp => ({
      id_empleado: emp.id_empleado.toString(),
      negocio_id: emp.negocio_id.toString(),
      usuario_id: emp.usuario_id.toString(),
      estado: emp.estado,
      fecha_alta: emp.fecha_alta,
      usuario: {
        id_usuario: emp.usuarios.id_usuario.toString(),
        nombre: emp.usuarios.nombre,
        correo_electronico: emp.usuarios.correo_electronico,
        numero_telefono: emp.usuarios.numero_telefono,
        avatar_url: emp.usuarios.avatar_url,
        fecha_registro: emp.usuarios.fecha_registro,
      },
    }));
  }

  /**
   * Obtiene un empleado específico por ID
   */
  async findOne(employeeId: bigint) {
    const employee = await this.prisma.empleados.findUnique({
      where: { id_empleado: employeeId },
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            correo_electronico: true,
            numero_telefono: true,
            avatar_url: true,
            fecha_registro: true,
            role: {
              select: {
                id_rol: true,
                nombre_rol: true,
              },
            },
          },
        },
        negocio: {
          select: {
            id_negocio: true,
            nombre: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Empleado con ID ${employeeId} no encontrado`);
    }

    return {
      id_empleado: employee.id_empleado.toString(),
      negocio_id: employee.negocio_id.toString(),
      usuario_id: employee.usuario_id.toString(),
      estado: employee.estado,
      fecha_alta: employee.fecha_alta,
      usuario: {
        id_usuario: employee.usuarios.id_usuario.toString(),
        nombre: employee.usuarios.nombre,
        correo_electronico: employee.usuarios.correo_electronico,
        numero_telefono: employee.usuarios.numero_telefono,
        avatar_url: employee.usuarios.avatar_url,
        fecha_registro: employee.usuarios.fecha_registro,
        role: employee.usuarios.role ? {
          id_rol: employee.usuarios.role.id_rol.toString(),
          nombre_rol: employee.usuarios.role.nombre_rol,
        } : null,
      },
      negocio: {
        id_negocio: employee.negocio.id_negocio.toString(),
        nombre: employee.negocio.nombre,
      },
    };
  }

  /**
   * Agrega un empleado a un negocio.
   * Si el usuario ya existe (por correo), lo vincula.
   * Si no existe, crea un usuario básico con rol 'empleado'.
   */
  async create(businessId: bigint, dto: CreateEmployeeDto) {
    // Verificar que el negocio existe
    const business = await this.prisma.negocio.findUnique({
      where: { id_negocio: businessId },
    });

    if (!business) {
      throw new NotFoundException(`Negocio con ID ${businessId} no encontrado`);
    }

    // Buscar usuario por correo
    let user = await this.prisma.usuarios.findUnique({
      where: { correo_electronico: dto.correo_electronico },
    });

    // Si no existe, crear usuario con rol empleado
    if (!user) {
      const employeeRole = await this.prisma.roles.findUnique({
        where: { nombre_rol: 'empleado' },
      });

      if (!employeeRole) {
        throw new BadRequestException('Rol empleado no encontrado en el sistema');
      }

      // Generar password temporal (deberías enviar correo de invitación)
      const bcrypt = require('bcrypt');
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      user = await this.prisma.usuarios.create({
        data: {
          correo_electronico: dto.correo_electronico,
          nombre: dto.nombre || dto.correo_electronico.split('@')[0],
          password_hash: hashedPassword,
          id_rol: employeeRole.id_rol,
          estado: 'pendiente', // Pendiente de verificación
        },
      });

      // TODO: Enviar correo de invitación con link para configurar password
      console.log(`[EMPLEADO CREADO] Enviar invitación a ${dto.correo_electronico} con password temporal: ${tempPassword}`);
    }

    // Verificar si ya es empleado de este negocio
    const existingEmployee = await this.prisma.empleados.findUnique({
      where: {
        uq_empleados_negocio_usuario: {
          negocio_id: businessId,
          usuario_id: user.id_usuario,
        },
      },
    });

    if (existingEmployee) {
      throw new ConflictException(`El usuario ${dto.correo_electronico} ya es empleado de este negocio`);
    }

    // Crear relación empleado
    const employee = await this.prisma.empleados.create({
      data: {
        negocio_id: businessId,
        usuario_id: user.id_usuario,
        estado: 'activo',
      },
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            correo_electronico: true,
            numero_telefono: true,
            avatar_url: true,
            fecha_registro: true,
          },
        },
      },
    });

    return {
      id_empleado: employee.id_empleado.toString(),
      negocio_id: employee.negocio_id.toString(),
      usuario_id: employee.usuario_id.toString(),
      estado: employee.estado,
      fecha_alta: employee.fecha_alta,
      usuario: {
        id_usuario: employee.usuarios.id_usuario.toString(),
        nombre: employee.usuarios.nombre,
        correo_electronico: employee.usuarios.correo_electronico,
        numero_telefono: employee.usuarios.numero_telefono,
        avatar_url: employee.usuarios.avatar_url,
        fecha_registro: employee.usuarios.fecha_registro,
      },
    };
  }

  /**
   * Actualiza el estado de un empleado (activo/inactivo)
   */
  async update(employeeId: bigint, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.empleados.findUnique({
      where: { id_empleado: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Empleado con ID ${employeeId} no encontrado`);
    }

    const updated = await this.prisma.empleados.update({
      where: { id_empleado: employeeId },
      data: { estado: dto.estado },
      include: {
        usuarios: {
          select: {
            id_usuario: true,
            nombre: true,
            correo_electronico: true,
            numero_telefono: true,
            avatar_url: true,
            fecha_registro: true,
          },
        },
      },
    });

    return {
      id_empleado: updated.id_empleado.toString(),
      negocio_id: updated.negocio_id.toString(),
      usuario_id: updated.usuario_id.toString(),
      estado: updated.estado,
      fecha_alta: updated.fecha_alta,
      usuario: {
        id_usuario: updated.usuarios.id_usuario.toString(),
        nombre: updated.usuarios.nombre,
        correo_electronico: updated.usuarios.correo_electronico,
        numero_telefono: updated.usuarios.numero_telefono,
        avatar_url: updated.usuarios.avatar_url,
        fecha_registro: updated.usuarios.fecha_registro,
      },
    };
  }

  /**
   * Elimina permanentemente un empleado (solo soft delete recomendado)
   */
  async remove(employeeId: bigint) {
    const employee = await this.prisma.empleados.findUnique({
      where: { id_empleado: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Empleado con ID ${employeeId} no encontrado`);
    }

    // Soft delete: cambiar estado a inactivo
    await this.prisma.empleados.update({
      where: { id_empleado: employeeId },
      data: { estado: 'inactivo' },
    });

    return { message: 'Empleado desactivado exitosamente' };
  }
}
