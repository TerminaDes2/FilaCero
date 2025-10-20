import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async createBusinessAndAssignOwner(userId: string, dto: CreateBusinessDto) {
    let uid: bigint;
    try { uid = BigInt(userId); } catch { throw new BadRequestException('Usuario inválido'); }
    const nombre = dto.nombre?.trim();
    if (!nombre || nombre.length < 2) throw new BadRequestException('Nombre de negocio inválido');

    const prisma = this.prisma as any;
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const negocio = await tx.negocio.create({
          data: {
            nombre,
            direccion: dto.direccion || null,
            telefono: dto.telefono || null,
            correo: dto.correo || null,
            logo_url: dto.logo_url || null,
            hero_image_url: dto.hero_image_url || null,
            fecha_registro: new Date(),
          },
        });
        await tx.usuarios_negocio.create({
          data: {
            id_usuario: uid,
            id_negocio: negocio.id_negocio,
            rol: 'owner',
            fecha_asignacion: new Date(),
          },
        });

        return negocio;
      });
      return result;
    } catch (e: any) {
      // Prisma error mapping for better DX
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003: FK constraint failed (should not happen here unless user/business ids mismatch)
        if (e.code === 'P2003') {
          throw new BadRequestException('No se pudo asignar el usuario al negocio (clave foránea inválida).');
        }
        // P2021: Table not found -> migrations not applied
        if (e.code === 'P2021') {
          throw new InternalServerErrorException('Esquema de base de datos desactualizado. Ejecuta las migraciones de Prisma.');
        }
      }
      throw e;
    }
  }

  async listBusinessesForUser(userId: string) {
    let uid: bigint;
    try { uid = BigInt(userId); } catch { throw new BadRequestException('Usuario inválido'); }
    const prisma = this.prisma as any;
    return prisma.negocio.findMany({
      where: { usuarios_negocio: { some: { id_usuario: uid } } },
      orderBy: { id_negocio: 'asc' },
    });
  }

  async getBusinessById(id: string) {
    let nid: bigint;
    try { nid = BigInt(id); } catch { throw new BadRequestException('ID inválido'); }
    const prisma = this.prisma as any;
    const negocio = await prisma.negocio.findUnique({ where: { id_negocio: nid } });
    if (!negocio) throw new NotFoundException('Negocio no encontrado');
    return negocio;
  }
}
