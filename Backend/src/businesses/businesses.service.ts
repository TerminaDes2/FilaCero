// backend/src/businesses/businesses.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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

  // ✅ Negocios públicos
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

  // ✅ Crear negocio (sin owner_id)
  async createBusinessAndAssignOwner(userId: string, dto: CreateBusinessDto) {
    let uid: bigint;
    try {
      uid = BigInt(userId);
    } catch {
      throw new BadRequestException('Usuario inválido');
    }

    const nombre = dto.nombre?.trim();
    if (!nombre || nombre.length < 2) {
      throw new BadRequestException('Nombre de negocio inválido');
    }

    const prisma = this.prisma as any;
    try {
      const result = await prisma.$transaction(async (tx: any) => {
        const negocio = await tx.negocio.create({
          data: {
            nombre,
            direccion: dto.direccion || null,
            telefono: dto.telefono || null,
            correo: dto.correo || null,
            logo_url: dto.logo || null,
            fecha_registro: new Date(),
            // ❌ Eliminado owner_id
          },
        });
        return negocio;
      });

      return {
        ...result,
        id_negocio: Number(result.id_negocio),
      };
    } catch (e: any) {
      console.error('Error creando negocio:', e);
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  // ✅ Negocios por usuario (sin owner_id)
  async listBusinessesForUser(userId: string) {
    let uid: bigint;
    try {
      uid = BigInt(userId);
    } catch {
      throw new BadRequestException('Usuario inválido');
    }

    const prisma = this.prisma as any;
    const businesses = await prisma.negocio.findMany({
      orderBy: { id_negocio: 'asc' },
    });

    return businesses.map((business) => ({
      ...business,
      id_negocio: Number(business.id_negocio),
    }));
  }

  // ✅ Obtener negocio por ID (sin owner_id)
  async getBusinessById(id: string) {
    try {
      const nid = Number(id);
      if (isNaN(nid)) {
        throw new BadRequestException('ID inválido');
      }

      console.log('📘 Buscando negocio con ID:', nid);

      const negocio = await this.prisma.negocio.findUnique({
        where: { id_negocio: nid },
      });

      if (!negocio) {
        console.warn('⚠️ Negocio no encontrado en la BD');
        throw new NotFoundException('Negocio no encontrado');
      }

      console.log('✅ Negocio encontrado:', negocio);

      return {
        ...negocio,
        id_negocio: Number(negocio.id_negocio),
      };
    } catch (err) {
      console.error('❌ ERROR en getBusinessById:', err);
      throw new InternalServerErrorException('Error interno al obtener el negocio');
    }
  }
}
