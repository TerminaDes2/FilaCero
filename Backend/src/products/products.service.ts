import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductMediaInputDto } from './dto/product-media.dto';

type SanitizedMedia = { url: string; principal: boolean; tipo: string | null };

const productInclude = Prisma.validator<Prisma.productoInclude>()({
  categoria: true,
  producto_media: { orderBy: [{ principal: 'desc' as const }, { creado_en: 'desc' as const }] },
  producto_metricas_semanales: { orderBy: { calculado_en: 'desc' as const }, take: 8 },
});

type ProductWithRelations = Prisma.productoGetPayload<{ include: typeof productInclude }>;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private mapProduct(product: ProductWithRelations, stock?: number | null) {
    const {
      categoria,
      producto_media: mediaRecords,
      producto_metricas_semanales: metricRecords,
      id_producto,
      id_categoria,
      precio,
      ...rest
    } = product;
    const mediaList = (mediaRecords ?? []).map((item) => ({
      id_media: item.id_media.toString(),
      url: item.url,
      principal: item.principal,
      tipo: item.tipo,
      creado_en: item.creado_en?.toISOString() ?? null,
    }));

    const metricList = (metricRecords ?? []).map((metric) => ({
      id_metricas: metric.id_metricas.toString(),
      id_negocio: metric.id_negocio ? metric.id_negocio.toString() : null,
      anio: metric.anio,
      semana: metric.semana,
      cantidad: metric.cantidad,
      calculado_en: metric.calculado_en?.toISOString() ?? null,
    }));

    const popularity = metricList.reduce((acc, item) => acc + (item.cantidad ?? 0), 0);

    return {
      ...rest,
      id_producto: id_producto.toString(),
      id_categoria: id_categoria ? id_categoria.toString() : null,
      precio: Number(precio),
      category: categoria?.nombre ?? null,
      stock: stock ?? null,
      media: mediaList,
      metricas: metricList,
      popularity,
    };
  }

  private sanitizeMediaPayload(media?: ProductMediaInputDto[]) {
    if (!media || media.length === 0) {
      return [] as SanitizedMedia[];
    }

    let principalFound = false;
    const sanitized = media.map((item) => {
      const markedAsPrincipal = item.principal === true && !principalFound;
      if (markedAsPrincipal) {
        principalFound = true;
      }
      return {
        url: item.url,
        principal: markedAsPrincipal,
        tipo: item.tipo ?? null,
      } as SanitizedMedia;
    });

    if (!principalFound && sanitized.length > 0) {
      sanitized[0].principal = true;
    }

    return sanitized;
  }

  private async replaceProductMedia(productId: bigint, media: SanitizedMedia[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.producto_media.deleteMany({ where: { id_producto: productId } });
      if (media.length > 0) {
        await tx.producto_media.createMany({
          data: media.map((item) => ({
            ...item,
            id_producto: productId,
          })),
        });
      }
    });
  }

  private async fetchProductWithRelations(id: bigint) {
    return this.prisma.producto.findUnique({
      where: { id_producto: id },
      include: productInclude,
    });
  }

  /**
   * Resuelve un identificador de categoría que puede venir como:
   *  - undefined / vacío: no asigna categoría
   *  - un string numérico (id autoincrement BigInt)
   *  - un nombre de categoría (ej: "General") -> busca o crea la categoría
   */
  private async resolveCategoryId(idOrName?: string): Promise<bigint | undefined> {
    if (!idOrName) return undefined;
    const value = idOrName.trim();
    if (!value) return undefined;

    // Si es numérico puro asumimos que es el id
    if (/^\d+$/.test(value)) {
      try {
        return BigInt(value);
      } catch {
        return undefined; // fallback silencioso
      }
    }

    // Interpretamos como nombre de categoría. Usamos upsert para evitar condición de carrera.
    const cat = await this.prisma.categoria.upsert({
      where: { nombre: value },
      update: {},
      create: { nombre: value },
    });
    return cat.id_categoria;
  }

  // ✅ Ahora async para poder resolver la categoría por nombre o id
  async create(createProductDto: CreateProductDto) {
    const { id_categoria, media, ...rest } = createProductDto;

    const resolvedCategory = await this.resolveCategoryId(id_categoria);
    const sanitizedMedia = this.sanitizeMediaPayload(media);

    const product = await this.prisma.producto.create({
      data: {
        ...rest,
        ...(resolvedCategory !== undefined && { id_categoria: resolvedCategory }),
        ...(sanitizedMedia.length > 0 && {
          producto_media: {
            create: sanitizedMedia,
          },
        }),
      },
      include: productInclude,
    });

    return this.mapProduct(product);
  }

  async findAll(params: { search?: string; status?: string; id_negocio?: string }) {
    const { search, status, id_negocio } = params;
    const where: Prisma.productoWhereInput = {};

    if (search) {
      where.nombre = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.estado = status;
    }

    let negocioIdFilter: bigint | undefined;
    if (id_negocio) {
      try {
        negocioIdFilter = BigInt(id_negocio);
      } catch {
        throw new BadRequestException('id_negocio inválido');
      }
    }

    let inventoryRows: Array<{ id_producto: bigint | null; cantidad_actual: number | null }> = [];
    if (negocioIdFilter !== undefined) {
      const negocioId = negocioIdFilter;
      inventoryRows = await this.prisma.inventario.findMany({
        where: { id_negocio: negocioId },
        select: { id_producto: true, cantidad_actual: true },
      });
      const productIds = Array.from(
        new Set(
          inventoryRows
            .map((row) => row.id_producto)
            .filter((value): value is bigint => value != null),
        ),
      );
      if (productIds.length === 0) {
        return [];
      }
      where.id_producto = { in: productIds };
    }

    const products = await this.prisma.producto.findMany({
      where,
      orderBy: { id_producto: 'desc' },
      include: productInclude,
    });

    if (negocioIdFilter === undefined) {
      inventoryRows = await this.prisma.inventario.findMany({
        select: { id_producto: true, cantidad_actual: true },
      });
    }

    const stockMap = new Map<string, number>();
    for (const row of inventoryRows) {
      const id = row.id_producto?.toString();
      if (!id) continue;
      const amount = Number(row.cantidad_actual ?? 0);
      stockMap.set(id, (stockMap.get(id) ?? 0) + amount);
    }

    return products.map((product) => {
      const id = product.id_producto.toString();
      const hasStockInfo = stockMap.has(id);
      const stockValue = stockMap.get(id);
      const normalizedStock = hasStockInfo ? Number(stockValue ?? 0) : null;
      return this.mapProduct(product, normalizedStock);
    });
  }

  async findOne(id: string) {
    // Convertimos el ID a BigInt para la consulta
    const productId = BigInt(id);

    const product = await this.fetchProductWithRelations(productId);

    if (!product) {
      throw new NotFoundException(`Producto con ID #${id} no encontrado`);
    }
    const stockAgg = await this.prisma.inventario.aggregate({
      _sum: { cantidad_actual: true },
      where: { id_producto: productId },
    });
    const stockValue = stockAgg._sum.cantidad_actual;
    const normalizedStock = stockValue == null ? null : Number(stockValue);
    return this.mapProduct(product, normalizedStock);
  }

  // ✅ Lógica de actualización corregida.
  async update(id: string, updateProductDto: UpdateProductDto) {
    const { id_categoria, media, ...rest } = updateProductDto;
    const productId = BigInt(id);

    const resolvedCategory = await this.resolveCategoryId(id_categoria);
    const sanitizedMedia = media ? this.sanitizeMediaPayload(media) : undefined;

    const product = await this.prisma.producto.update({
      where: { id_producto: productId },
      data: {
        ...rest,
        ...(resolvedCategory !== undefined && { id_categoria: resolvedCategory }),
      },
      include: productInclude,
    });

    if (sanitizedMedia) {
      await this.replaceProductMedia(productId, sanitizedMedia);
      const refreshed = await this.fetchProductWithRelations(productId);
      if (!refreshed) {
        throw new NotFoundException(`Producto con ID #${id} no encontrado luego de actualizar media.`);
      }
      return this.mapProduct(refreshed);
    }

    return this.mapProduct(product);
  }

  async remove(id: string) {
    const productId = BigInt(id);

    // Verificar existencia previa para devolver 404 coherente
    await this.findOne(id);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Limpiamos dependencias directas antes de eliminar el producto
        const movimientoTable = await tx.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'movimientos_inventario'
          ) AS exists
        `;

        if (movimientoTable?.[0]?.exists) {
          await tx.$executeRaw`DELETE FROM movimientos_inventario WHERE id_producto = ${productId}`;
        }

        await tx.inventario.deleteMany({ where: { id_producto: productId } });
        await tx.producto.delete({ where: { id_producto: productId } });
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        // Existen registros dependientes (p.ej. ventas) que impiden eliminarlo
        throw new ConflictException('No se puede eliminar el producto porque tiene dependencias activas (ventas u otros registros).');
      }
      throw e;
    }

    return { message: `Producto con ID #${id} eliminado correctamente.`, deleted: true };
  }
}