// backend/src/businesses/businesses.service.ts
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
        // Crear el negocio
        const negocio = await tx.negocio.create({
          data: {
            nombre,
            direccion: dto.direccion || null,
            telefono: dto.telefono || null,
            correo: dto.correo || null,
            logo: dto.logo || null,
            fecha_registro: new Date(),
            owner_id: uid, // Asignar el owner directamente
          },
        });

        return negocio;
      });
      
      // Convertir BigInt a Number para la respuesta
      return {
        ...result,
        id_negocio: Number(result.id_negocio),
        owner_id: result.owner_id ? Number(result.owner_id) : null
      };
    } catch (e: any) {
      // Manejo de errores de Prisma
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003: FK constraint failed
        if (e.code === 'P2003') {
          throw new BadRequestException('No se pudo asignar el usuario al negocio (clave foránea inválida).');
        }
        // P2021: Table not found
        if (e.code === 'P2021') {
          throw new InternalServerErrorException('Esquema de base de datos desactualizado. Ejecuta las migraciones de Prisma.');
        }
        // P2002: Unique constraint failed
        if (e.code === 'P2002') {
          throw new BadRequestException('Ya existe un negocio con ese nombre.');
        }
      }
      console.error('Error creating business:', e);
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async listBusinessesForUser(userId: string) {
    let uid: bigint;
    try { 
      uid = BigInt(userId); 
    } catch { 
      throw new BadRequestException('Usuario inválido'); 
    }
    
    const prisma = this.prisma as any;
    const businesses = await prisma.negocio.findMany({
      where: { 
        OR: [
          { owner_id: uid },
          { usuarios_negocio: { some: { id_usuario: uid } } }
        ]
      },
      orderBy: { id_negocio: 'asc' },
    });

    // Convertir BigInt a Number para la respuesta
    return businesses.map(business => ({
      ...business,
      id_negocio: Number(business.id_negocio),
      owner_id: business.owner_id ? Number(business.owner_id) : null
    }));
  }

  async getBusinessById(id: string) {
    let nid: bigint;
    try { 
      nid = BigInt(id); 
    } catch { 
      throw new BadRequestException('ID inválido'); 
    }
    
    const prisma = this.prisma as any;
    const negocio = await prisma.negocio.findUnique({ 
      where: { id_negocio: nid } 
    });
    
    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }
    
    // Convertir BigInt a Number para la respuesta
    return {
      ...negocio,
      id_negocio: Number(negocio.id_negocio),
      owner_id: negocio.owner_id ? Number(negocio.owner_id) : null
    };
  }
}