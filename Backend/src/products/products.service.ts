import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { ConfigService } from '@nestjs/config';
// Prisma import intentionally omitted; we use runtime code checks rather than type-only checks

const productInclude = {
  categoria: true,
  producto_media: { orderBy: [{ principal: 'desc' }, { creado_en: 'desc' }] },
  producto_metricas_semanales: { orderBy: { calculado_en: 'desc' }, take: 8 },
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private configService: ConfigService, private pedidosService: PedidosService) {}

  private mapProduct(product: any, stock: number | null = null) {
    const baseUrl = this.configService.get('API_BASE_URL') || 'http://localhost:3000';
    const { categoria, producto_media: mediaRecords, producto_metricas_semanales: metricRecords, id_producto, id_categoria, precio, ...rest } = product;
    const mediaList = (mediaRecords ?? []).map((item: any) => {
      let url = item.url;
      if (url && !/^https?:\/\//i.test(url)) {
        if (url.startsWith('/uploads/')) {
          url = `${baseUrl}${url}`;
        }
      }
      return {
        id_media: item.id_media.toString(),
        url,
        principal: item.principal,
        tipo: item.tipo,
        creado_en: item.creado_en?.toISOString() ?? null,
      };
    });
    const metricList = (metricRecords ?? []).map((metric: any) => ({
      id_metricas: metric.id_metricas.toString(),
      id_negocio: metric.id_negocio ? metric.id_negocio.toString() : null,
      anio: metric.anio,
      semana: metric.semana,
      cantidad: metric.cantidad,
      calculado_en: metric.calculado_en?.toISOString() ?? null,
    }));
    const popularity = metricList.reduce((acc: number, item: any) => acc + (item.cantidad ?? 0), 0);
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

  private sanitizeMediaPayload(media: any[]) {
    if (!media || media.length === 0) return [];
    let principalFound = false;
    const sanitized = media.map((item: any) => {
      const markedAsPrincipal = item.principal === true && !principalFound;
      if (markedAsPrincipal) principalFound = true;
      return {
        url: item.url,
        principal: markedAsPrincipal,
        tipo: item.tipo ?? null,
      };
    });
    if (!principalFound && sanitized.length > 0) sanitized[0].principal = true;
    return sanitized;
  }

  async replaceProductMedia(productId: bigint, media: any[]) {
    const prisma = this.prisma as any;
    await prisma.$transaction(async (tx: any) => {
      await tx.$executeRawUnsafe(`DELETE FROM producto_media WHERE id_producto = $1`, productId.toString());
      for (const item of media) {
        await tx.$executeRawUnsafe(`INSERT INTO producto_media (id_producto, url, principal, tipo) VALUES ($1, $2, $3, $4)`, productId.toString(), item.url, item.principal, item.tipo);
      }
    });
  }

  async fetchProductWithRelations(id: bigint) {
    const prisma = this.prisma as any;
    return await prisma.producto.findUnique({ where: { id_producto: id }, include: productInclude as any });
  }

  async resolveCategoryId(idOrName?: string) {
    if (!idOrName) return undefined;
    const value = idOrName.trim();
    if (!value) return undefined;
    if (/^\d+$/.test(value)) {
      try { return BigInt(value); } catch { return undefined; }
    }
    const prisma = this.prisma as any;
    const cat = await prisma.categoria.upsert({ where: { nombre: value }, update: {}, create: { nombre: value } });
    return cat.id_categoria;
  }

  async create(createProductDto: any, file?: any) {
    const { id_categoria, media, ...rest } = createProductDto;
    const resolvedCategory = await this.resolveCategoryId(id_categoria);
    const mediaInput = media || [];
    if (file) {
      const baseUrl = this.configService.get('API_BASE_URL') || 'http://localhost:3000';
      const imageUrl = `${baseUrl}/uploads/${file.filename}`;
      mediaInput.unshift({ url: imageUrl, principal: true, tipo: file.mimetype });
    }
    const sanitizedMedia = this.sanitizeMediaPayload(mediaInput);
    const prisma = this.prisma as any;
    const product = await prisma.producto.create({
      data: {
        ...rest,
        precio: Number(rest.precio),
        ...(resolvedCategory !== undefined && { id_categoria: resolvedCategory }),
        ...(sanitizedMedia.length > 0 && { producto_media: { create: sanitizedMedia } }),
      },
      include: productInclude as any,
    });
    return this.mapProduct(product);
  }

  async findAll(params: { search?: string; status?: string; id_negocio?: string; categoria?: string }) {
    const { search, status, id_negocio, categoria } = params;
    const where: any = {};
    let categoryFilter: bigint | undefined;
    const wantsUncategorized = categoria === '__none__';
    if (categoria && !wantsUncategorized) {
      try { categoryFilter = BigInt(categoria); } catch { throw new BadRequestException('categoria inválida'); }
    }
    if (search) where.nombre = { contains: search, mode: 'insensitive' } as any;
    if (status) where.estado = status;
    if (wantsUncategorized) {
      where.id_categoria = { equals: null };
    } else if (categoryFilter !== undefined) {
      where.id_categoria = categoryFilter;
    }
    let negocioIdFilter: bigint | undefined;
    if (id_negocio) {
      try { negocioIdFilter = BigInt(id_negocio); } catch { throw new BadRequestException('id_negocio inválido'); }
    }
    let inventoryRows: any[] = [];
    if (negocioIdFilter !== undefined) {
      const negocioId = negocioIdFilter;
      const prisma = this.prisma as any;
      inventoryRows = await prisma.inventario.findMany({ where: { id_negocio: negocioId }, select: { id_producto: true, cantidad_actual: true } });
      const productIds = Array.from(new Set(inventoryRows.map((row) => row.id_producto).filter((value) => value != null)));
      if (productIds.length === 0) return [];
      where.id_producto = { in: productIds } as any;
    }
    const prisma = this.prisma as any;
    const products = (await prisma.producto.findMany({ where, orderBy: { id_producto: 'desc' }, include: productInclude as any }));
    if (negocioIdFilter === undefined) {
      inventoryRows = await prisma.inventario.findMany({ select: { id_producto: true, cantidad_actual: true } });
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

  async listCategories(params: { id_negocio?: string }) {
    const { id_negocio } = params;
    const where: any = {};
    let negocioIdFilter: bigint | undefined;
    if (id_negocio) {
      try { negocioIdFilter = BigInt(id_negocio); } catch { throw new BadRequestException('id_negocio inválido'); }
    }
    if (negocioIdFilter !== undefined) {
      const inventoryRows = await this.prisma.inventario.findMany({ where: { id_negocio: negocioIdFilter }, select: { id_producto: true } });
      const productIds = Array.from(new Set(inventoryRows.map((row) => row.id_producto).filter((value) => value != null)));
      if (productIds.length === 0) return [];
      where.id_producto = { in: productIds } as any;
    }
    const products = await this.prisma.producto.findMany({ where, select: { id_categoria: true, categoria: { select: { nombre: true } } } });
    if (products.length === 0) return [];
    const bucket = new Map<string, { id: string | null; nombre: string; total: number }>();
    for (const product of products) {
      const idCategoria = product.id_categoria ? product.id_categoria.toString() : null;
      const key = idCategoria ?? '__none__';
      const nombre = product.categoria?.nombre?.trim() || 'Sin categoría';
      const existing = bucket.get(key);
      if (existing) {
        existing.total += 1;
      } else {
        bucket.set(key, { id: idCategoria, nombre, total: 1 });
      }
    }
    const ordered = Array.from(bucket.values()).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.nombre.localeCompare(b.nombre);
    });
    return ordered.map((cat) => ({ id: cat.id, nombre: cat.nombre, totalProductos: cat.total, value: cat.id ?? '__none__' }));
  }

  async findOne(id: string | number) {
    const productId = BigInt(String(id));
    const product = await this.fetchProductWithRelations(productId);
    if (!product) throw new NotFoundException(`Producto con ID #${id} no encontrado`);
    const stockAgg = await this.prisma.inventario.aggregate({ _sum: { cantidad_actual: true }, where: { id_producto: productId } });
    const stockValue = (stockAgg as any)._sum.cantidad_actual;
    const normalizedStock = stockValue == null ? null : Number(stockValue);
    return this.mapProduct(product, normalizedStock);
  }

  async update(id: string | number, updateProductDto: any) {
    const { id_categoria, media, ...rest } = updateProductDto;
    const productId = BigInt(String(id));
    const resolvedCategory = await this.resolveCategoryId(id_categoria);
    const sanitizedMedia = media ? this.sanitizeMediaPayload(media) : undefined;
    const prisma = this.prisma as any;
    // leer producto actual antes de actualizar
    const before = await prisma.producto.findUnique({ where: { id_producto: productId } });
    const product = await prisma.producto.update({ where: { id_producto: productId }, data: { ...rest, ...(resolvedCategory !== undefined && { id_categoria: resolvedCategory }) }, include: productInclude as any });
    if (sanitizedMedia) {
      await this.replaceProductMedia(productId, sanitizedMedia);
      const refreshed = await this.fetchProductWithRelations(productId);
      if (!refreshed) throw new NotFoundException(`Producto con ID #${id} no encontrado luego de actualizar media.`);
      return this.mapProduct(refreshed);
    }
    // Si el estado cambia a inactivo -> cancelar pedidos que incluyen este producto
    try {
      if (before && before.estado !== 'inactivo' && product.estado === 'inactivo') {
        await this.pedidosService.cancelPedidosContainingProduct(productId, 'producto_desactivado');
      }
    } catch (e) {
      console.error('Error al cancelar pedidos por desactivación del producto:', e);
    }
    return this.mapProduct(product);
  }

  async remove(id: string | number) {
    const productId = BigInt(String(id));
    await this.findOne(id);
    try {
      const prisma = this.prisma as any;
      await prisma.$transaction(async (tx: any) => {
        const movimientoTable = await tx.$queryRaw `
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'movimientos_inventario'
          ) AS exists
        `;
        if ((movimientoTable as any)?.[0]?.exists) {
          await tx.$executeRaw `DELETE FROM movimientos_inventario WHERE id_producto = ${productId}`;
        }
        await tx.inventario.deleteMany({ where: { id_producto: productId } });
        await tx.producto.delete({ where: { id_producto: productId } });
      });
    } catch (e: any) {
      if ((e as any)?.code === 'P2003') {
        throw new ConflictException('No se puede eliminar el producto porque tiene dependencias activas (ventas u otros registros).');
      }
      throw e;
    }
    return { message: `Producto con ID #${id} eliminado correctamente.`, deleted: true };
  }
}
