// Backend/src/businesses/businesses.service.ts

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

  // ... (tu función listPublicBusinesses se queda igual) ...
  async listPublicBusinesses(filters: PublicBusinessFilters = {}) {
    const prisma = this.prisma as any;
    const search = filters.search?.trim();
    const limit = Number.isFinite(filters.limit)
      ? Math.min(Math.max(Math.floor(filters.limit!), 1), MAX_PUBLIC_LIMIT)
      : DEFAULT_PUBLIC_LIMIT;
    const sqlBase = `
      SELECT ... (Todo tu SQL) ...
    `;
    if (search) {
      return prisma.$queryRaw`
        ${sqlBase}
        WHERE n.nombre ILIKE ${`%${search}%`}
        GROUP BY n.id_negocio
        ORDER BY n.nombre ASC
        LIMIT ${limit}
      `;
    }
    return prisma.$queryRaw`
      ${sqlBase}
      GROUP BY n.id_negocio
      ORDER BY n.nombre ASC
      LIMIT ${limit}
    `;
  }


  // ✅ Crear negocio (¡CORREGIDO! Ya no intenta guardar owner_id)
  async createBusinessAndAssignOwner(userId: string, dto: CreateBusinessDto) {
    // Aunque recibimos el 'userId' del controlador, no lo usaremos
    // para la base de datos, tal como lo pediste.
    let uid: bigint;
    try {
      uid = BigInt(userId); // Lo validamos por si lo necesitas para otra cosa
    } catch {
      throw new BadRequestException('Usuario inválido');
    }

    const nombre = dto.nombre?.trim();
    if (!nombre || nombre.length < 2) {
      throw new BadRequestException('Nombre de negocio inválido');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const negocio = await tx.negocio.create({
          data: {
            nombre,
            direccion: dto.direccion || null,
            telefono: dto.telefono || null,
            correo: dto.correo || null,
            logo_url: dto.logo || null,
            hero_image_url: dto.hero_image_url || null,
            fecha_registro: new Date(),
            // --- ¡CAMBIO CRÍTICO! ---
            // owner_id: uid, // <- ESTA LÍNEA SE QUITA
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
      if (e && e.code === 'P2002') {
        throw new BadRequestException('Ya existe un negocio con ese nombre');
      }
      // Captura genérica si P2022 (columna no existe) vuelve a aparecer
      if (e && e.code === 'P2022') {
         throw new InternalServerErrorException(`Error de base de datos: ${e.message}`);
      }
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  // ✅ Negocios por usuario (¡CORREGIDO! Ya no filtra por owner_id)
  async listBusinessesForUser(userId: string) {
    let uid: bigint;
    try {
      uid = BigInt(userId);
    } catch {
      throw new BadRequestException('Usuario inválido');
    }

    // Devuelve todos los negocios, como en tu lógica original
    const businesses = await this.prisma.negocio.findMany({
      orderBy: { id_negocio: 'asc' },
    });

    return businesses.map((business) => ({
      ...business,
      id_negocio: Number(business.id_negocio),
    }));
  }

  // ... (tu función getBusinessById se queda igual) ...
  async getBusinessById(id: string) {
    try {
      const nid = Number(id);
      if (isNaN(nid)) {
        throw new BadRequestException('ID inválido');
      }
      const negocio = await this.prisma.negocio.findUnique({
        where: { id_negocio: nid },
      });
      if (!negocio) {
        throw new NotFoundException('Negocio no encontrado');
      }
      return {
        ...negocio,
        id_negocio: Number(negocio.id_negocio),
      };
    } catch (err) {
      console.error('❌ ERROR en getBusinessById:', err);
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
         throw err;
      }
      throw new InternalServerErrorException('Error interno al obtener el negocio');
    }
  }
}