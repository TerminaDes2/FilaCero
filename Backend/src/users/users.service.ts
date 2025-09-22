import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.usuarios.findUnique({ where: { correo_electronico: email } });
  }

  async create(data: { nombre: string; correo_electronico: string; password: string; numero_telefono?: string }) {
    const existing = await this.findByEmail(data.correo_electronico);
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(data.password, 10);

    const created = await this.prisma.usuarios.create({
      data: {
        nombre: data.nombre,
        correo_electronico: data.correo_electronico,
        password_hash: hashed,
        numero_telefono: data.numero_telefono ?? null,
        fecha_registro: new Date(),
        estado: 'activo',
      },
    });

    // opcional: eliminar password antes de devolver
    // @ts-ignore
    delete created.password_hash;
    return created;
  }

  async findById(id: bigint | number | string) {
    // Acepta BigInt/string/number — prisma usa BigInt
    const idBigInt = typeof id === 'bigint' ? id : BigInt(Number(id));
    return this.prisma.usuarios.findUnique({ where: { id_usuario: idBigInt } as any });
  }
}
