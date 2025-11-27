// Backend/src/businesses/businesses.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

interface PublicBusinessFilters {
  search?: string;
  limit?: number;
}

const DEFAULT_PUBLIC_LIMIT = 20;
const MAX_PUBLIC_LIMIT = 50;

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  // Listado público optimizado con SQL raw (muestra resumen y categorías)
  async listPublicBusinesses(filters: PublicBusinessFilters = {}) {
    const search = filters.search?.trim();
    const limit = Number.isFinite(filters.limit)
      ? Math.min(Math.max(Math.floor(filters.limit!), 1), MAX_PUBLIC_LIMIT)
      : DEFAULT_PUBLIC_LIMIT;

    const businesses = await this.prisma.negocio.findMany({
      where: search
        ? {
            nombre: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : undefined,
      take: limit,
      orderBy: { nombre: 'asc' },
      select: {
        id_negocio: true,
        nombre: true,
        direccion: true,
        telefono: true,
        correo: true,
        logo_url: true,
        hero_image_url: true,
        fecha_registro: true,
        _count: {
          select: {
            inventario: true,
            negocio_rating: true,
            pedidos: true,
          },
        },
      },
    });

    if (!businesses.length) {
      return [];
    }

    const ids = businesses.map((biz) => biz.id_negocio);

    const categoryMap = new Map<string, string[]>();
    const ratingMap = new Map<string, number>();
    const salesMap = new Map<
      string,
      {
        total: number;
        count: number;
      }
    >();
    const highlightedMap = new Map<string, Array<{
      cantidad_actual: number | null;
      stock_minimo: number | null;
      producto: {
        id_producto: bigint;
        nombre: string;
        descripcion: string | null;
        precio: Prisma.Decimal;
        imagen_url: string | null;
        categoria: { nombre: string | null } | null;
      } | null;
    }>>();

    if (ids.length) {
      try {
        const [categoryRows, ratingRows, salesRows, highlightedProducts] = await Promise.all([
          this.prisma.negocio_categoria.findMany({
            where: { id_negocio: { in: ids } },
            select: {
              id_negocio: true,
              categoria: {
                select: { nombre: true },
              },
            },
          }),
          this.prisma.negocio_rating.groupBy({
            by: ['id_negocio'],
            where: { id_negocio: { in: ids } },
            _avg: { estrellas: true },
          }),
          this.prisma.venta.groupBy({
            by: ['id_negocio'],
            where: {
              id_negocio: { in: ids },
              total: { not: null },
            },
            _sum: { total: true },
            _count: { _all: true },
          }),
          Promise.all(
            ids.map((id) =>
              this.prisma.inventario.findMany({
                where: { id_negocio: id },
                orderBy: [{ cantidad_actual: 'desc' }],
                take: 4,
                select: {
                  cantidad_actual: true,
                  stock_minimo: true,
                  producto: {
                    select: {
                      id_producto: true,
                      nombre: true,
                      descripcion: true,
                      precio: true,
                      imagen_url: true,
                      categoria: {
                        select: { nombre: true },
                      },
                    },
                  },
                },
              })
            )
          ),
        ]);

        for (const row of categoryRows) {
          const key = row.id_negocio.toString();
          if (!categoryMap.has(key)) {
            categoryMap.set(key, []);
          }
          const storeCategories = categoryMap.get(key)!;
          const name = row.categoria?.nombre?.trim();
          if (name && !storeCategories.includes(name)) {
            storeCategories.push(name);
          }
        }

        for (const row of ratingRows) {
          const key = row.id_negocio.toString();
          const avg = row._avg?.estrellas;
          if (avg !== null && avg !== undefined) {
            const numeric = this.decimalToNumber(avg);
            ratingMap.set(key, Number.isFinite(numeric) ? numeric : 0);
          }
        }

        for (const row of salesRows) {
          const key = row.id_negocio.toString();
          const total = row._sum?.total;
          const numeric = total !== null && total !== undefined ? this.decimalToNumber(total) : 0;
          salesMap.set(key, {
            total: numeric,
            count: row._count?._all ?? 0,
          });
        }

        highlightedProducts.forEach((items, index) => {
          const id = ids[index];
          highlightedMap.set(id.toString(), items);
        });
      } catch (error) {
        console.error('[BusinessesService] Error enriqueciendo resumen público de negocios', error);
      }
    }

    return businesses.map((biz) => {
      const key = biz.id_negocio.toString();
      const categorias = categoryMap.get(key) ?? [];
      categorias.sort((a, b) => a.localeCompare(b, 'es'));
      const avgRating = ratingMap.has(key) ? ratingMap.get(key)! : null;
      const salesMetrics = salesMap.get(key);
      const highlights = highlightedMap.get(key) ?? [];

      const productosDestacados = highlights
        .filter((item) => Boolean(item.producto))
        .map((item) => {
          const prod = item.producto as any;
          const price = prod?.precio !== undefined && prod?.precio !== null ? this.decimalToNumber(prod.precio) : 0;
          return {
            id_producto: Number(prod?.id_producto ?? 0),
            nombre: prod?.nombre ?? 'Producto',
            descripcion: prod?.descripcion ?? null,
            precio: price,
            imagen_url: prod?.imagen_url ?? null,
            categoria: prod?.categoria?.nombre ?? null,
            stock: item.cantidad_actual ?? 0,
            stock_minimo: item.stock_minimo ?? 0,
          };
        });

      const logoCandidate = biz.logo_url ?? (biz as any).logo ?? null;
      const heroCandidate = biz.hero_image_url ?? (biz as any).heroImageUrl ?? null;

      return {
        id_negocio: Number(biz.id_negocio),
        nombre: biz.nombre,
        descripcion: (biz as any).descripcion ?? null,
        direccion: biz.direccion ?? null,
        telefono: biz.telefono ?? null,
        correo: biz.correo ?? null,
        logo_url: logoCandidate,
        hero_image_url: heroCandidate,
        fecha_registro: biz.fecha_registro ? biz.fecha_registro.toISOString() : null,
        categorias,
        resumen: {
          totalProductos: biz._count?.inventario ?? 0,
          totalCategorias: categorias.length,
          totalPedidos: biz._count?.pedidos ?? 0,
          totalResenas: biz._count?.negocio_rating ?? 0,
          promedioEstrellas:
            avgRating !== null && avgRating !== undefined
              ? Number(avgRating.toFixed ? avgRating.toFixed(2) : avgRating)
              : null,
          totalVentasRegistradas: salesMetrics?.count ?? 0,
          ingresosAcumulados: salesMetrics?.total ?? 0,
        },
        productosDestacados,
      };
    });
  }

  // Crear negocio y asignar owner_id (si se proporciona userId válido)
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
        // Construimos los campos de forma flexible para evitar desajustes de tipos en clientes Prisma distintos
        const data: any = {
          nombre,
          direccion: dto.direccion || null,
          telefono: dto.telefono || null,
          correo: dto.correo || null,
          fecha_registro: new Date(),
          owner_id: uid,
        };
        if (typeof dto.logo === 'string') data.logo_url = dto.logo;
        if (typeof dto.hero_image_url === 'string') data.hero_image_url = dto.hero_image_url;

        const negocio = await tx.negocio.create({ data });

        return negocio;
      });

      return {
        ...result,
        id_negocio: Number(result.id_negocio),
        owner_id: (result as any).owner_id ? Number((result as any).owner_id) : null,
      };
    } catch (e: any) {
      // Manejo explícito de errores conocidos de Prisma
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2003') {
          throw new BadRequestException('No se pudo asignar el usuario al negocio (clave foránea inválida).');
        }
        if (e.code === 'P2021') {
          throw new InternalServerErrorException('Esquema de base de datos desactualizado. Ejecuta las migraciones de Prisma.');
        }
        if (e.code === 'P2002') {
          throw new BadRequestException('Ya existe un negocio con ese nombre.');
        }
      }

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

  async updateBusiness(userId: string, businessId: string, dto: UpdateBusinessDto) {
    const uid = this.parseBigInt(userId, 'Usuario inválido');
    const nid = this.parseBigInt(businessId, 'Negocio inválido');

    const negocio = await (this.prisma as any).negocio.findUnique({ where: { id_negocio: nid } });
    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const isOwner = negocio.owner_id !== null && negocio.owner_id !== undefined && BigInt(negocio.owner_id) === uid;
    if (!isOwner) {
      const assignment = await (this.prisma as any).usuarios_negocio.findFirst({
        where: { id_usuario: uid, id_negocio: nid },
      });
      if (!assignment) {
        throw new ForbiddenException('No tienes permisos para actualizar este negocio');
      }
    }

    const data: Record<string, unknown> = {};

    if (dto.nombre !== undefined) {
      const nombre = dto.nombre.trim();
      if (nombre.length < 2) {
        throw new BadRequestException('Nombre de negocio inválido');
      }
      data.nombre = nombre;
    }

    if (dto.direccion !== undefined) {
      data.direccion = this.normalizeOptional(dto.direccion, 255);
    }

    if (dto.telefono !== undefined) {
      data.telefono = this.normalizeOptional(dto.telefono, 30);
    }

    if (dto.correo !== undefined) {
      data.correo = this.normalizeOptional(dto.correo, 254);
    }

    if (dto.logo !== undefined) {
      data.logo_url = this.normalizeOptional(dto.logo, 2048);
    }

    if (dto.logo_url !== undefined) {
      data.logo_url = this.normalizeOptional(dto.logo_url, 2048);
    }

    if (dto.hero_image_url !== undefined) {
      data.hero_image_url = this.normalizeOptional(dto.hero_image_url, 2048);
    }

    if (Object.keys(data).length === 0) {
      return this.hydrateBusinessResponse(negocio);
    }

    try {
      const updated = await (this.prisma as any).negocio.update({
        where: { id_negocio: nid },
        data,
      });
      return this.hydrateBusinessResponse(updated);
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new BadRequestException('Ya existe un negocio con ese nombre.');
        }
        if (e.code === 'P2025') {
          throw new NotFoundException('Negocio no encontrado');
        }
      }
      console.error('Error actualizando negocio:', e);
      throw new InternalServerErrorException('Error interno al actualizar el negocio');
    }
  }

  // Listar negocios asociados a un usuario: owner o empleado
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
          { empleados: { some: { usuario_id: uid } } },
        ],
      },
      orderBy: { id_negocio: 'asc' },
    });

    return businesses.map((business: any) => ({
      ...business,
      id_negocio: Number(business.id_negocio),
      owner_id: (business as any).owner_id ? Number((business as any).owner_id) : null,
    }));
  }

  // Obtener negocio por ID con validaciones y logs útiles para debugging
  async getBusinessById(id: string) {
    try {
      const nid = BigInt(id);

      console.log('📘 Buscando negocio con ID:', nid.toString());

      const negocio = await this.prisma.negocio.findUnique({
        where: { id_negocio: nid },
      });
      if (!negocio) {
        throw new NotFoundException('Negocio no encontrado');
      }

      return {
        ...negocio,
        id_negocio: Number(negocio.id_negocio),
        owner_id: (negocio as any).owner_id ? Number((negocio as any).owner_id) : null,
      };
    } catch (err: any) {
      console.error('❌ ERROR en getBusinessById:', err);
      if (err instanceof NotFoundException || err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Error interno al obtener el negocio');
    }
  }

  private hydrateBusinessResponse(raw: any) {
    if (!raw) return raw;
    return {
      ...raw,
      id_negocio: Number(raw.id_negocio),
      owner_id: raw.owner_id !== null && raw.owner_id !== undefined ? Number(raw.owner_id) : null,
    };
  }

  private normalizeOptional(value: string | undefined, maxLength: number): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.length > maxLength) {
      throw new BadRequestException(`El valor supera la longitud máxima de ${maxLength} caracteres.`);
    }
    return trimmed;
  }

  private parseBigInt(value: string, message: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException(message);
    }
  }

  private decimalToNumber(value: Prisma.Decimal | number | string | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof (value as any).toNumber === 'function') {
      return (value as Prisma.Decimal).toNumber();
    }
    return Number(value);
  }
}