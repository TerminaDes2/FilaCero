import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';

interface PublicBusinessFilters {
  search?: string;
  limit?: number;
}

const DEFAULT_PUBLIC_LIMIT = 20;
const MAX_PUBLIC_LIMIT = 50;

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async listPublicBusinesses(filters: PublicBusinessFilters = {}) {
    const prisma = this.prisma as any;
    const search = filters.search?.trim();
    const limit = Number.isFinite(filters.limit)
      ? Math.min(Math.max(Math.floor(filters.limit!), 1), MAX_PUBLIC_LIMIT)
      : DEFAULT_PUBLIC_LIMIT;

    const whereClause = search
      ? Prisma.sql`WHERE n.nombre ILIKE ${`%${search}%`}`
      : Prisma.sql``;

    const query = Prisma.sql`
      SELECT
        n.id_negocio,
        n.nombre,
        n.direccion AS descripcion,
        n.telefono,
        n.correo,
        n.logo_url AS logo,
        n.hero_image_url,
  COALESCE(ROUND(AVG(r.estrellas)::numeric, 1), 0)::float AS estrellas,
        COALESCE(
          (
            SELECT array_agg(DISTINCT c.nombre ORDER BY c.nombre)
            FROM categoria c
            JOIN producto p ON p.id_categoria = c.id_categoria
            JOIN inventario inv ON inv.id_producto = p.id_producto AND inv.id_negocio = n.id_negocio
            WHERE inv.cantidad_actual IS NULL OR inv.cantidad_actual > 0
          ),
          ARRAY[]::text[]
        ) AS categorias
      FROM negocio n
      LEFT JOIN negocio_rating r ON r.id_negocio = n.id_negocio
      ${whereClause}
      GROUP BY n.id_negocio
      ORDER BY n.nombre ASC
      LIMIT ${limit}
    `;

    return prisma.$queryRaw(query);
  }

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
