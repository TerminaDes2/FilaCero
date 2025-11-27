// Backend/src/products/products.service.ts

import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import type { Express } from 'express';
import { Prisma, producto, categoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductMediaInputDto } from './dto/product-media.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

type SanitizedMedia = { url: string; principal: boolean; tipo: string | null };

const productInclude = {
  categoria: true,
  producto_media: { orderBy: [{ principal: 'desc' as const }, { creado_en: 'desc' as const }] },
  producto_metricas_semanales: { orderBy: { calculado_en: 'desc' as const }, take: 8 },
} as const;

type ProductWithRelations = producto & {
  categoria: Pick<categoria, 'nombre'> | null;
  producto_media: any[];
  producto_metricas_semanales: any[];
};

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private mapProduct(product: ProductWithRelations, stock?: number | null) {
    // Normalización de URLs de media para asegurar rutas absolutas
    const baseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3000';
    const {
      categoria,
      producto_media: mediaRecords,
      producto_metricas_semanales: metricRecords,
      id_producto,
      id_categoria,
      precio,
      ...rest
    } = product;
    const mediaList = (mediaRecords ?? []).map((item) => {
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
    // ... (tu función sanitizeMediaPayload sin cambios)
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
    // Usamos SQL crudo para evitar dependencia del cliente Prisma si el modelo aún no expone 'producto_media'
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `DELETE FROM producto_media WHERE id_producto = $1`,
        productId.toString(),
      );
      for (const item of media) {
        await tx.$executeRawUnsafe(
          `INSERT INTO producto_media (id_producto, url, principal, tipo) VALUES ($1, $2, $3, $4)`,
          productId.toString(),
          item.url,
          item.principal,
          item.tipo,
        );
      }
    });
  }

  private async fetchProductWithRelations(id: bigint) {
    // ... (tu función fetchProductWithRelations sin cambios)
    const product = await this.prisma.producto.findUnique({
      where: { id_producto: id },
      include: productInclude as unknown as Prisma.productoInclude,
    });
    return product as unknown as ProductWithRelations | null;
  }

  private async resolveCategoryId(idOrName?: string): Promise<bigint | undefined> {
    // ... (tu función resolveCategoryId sin cambios)
    if (!idOrName) return undefined;
    const value = idOrName.trim();
    if (!value) return undefined;

    if (/^\d+$/.test(value)) {
      try {
        return BigInt(value);
      } catch {
        return undefined;
      }
    }

    const cat = await this.prisma.categoria.upsert({
      where: { nombre: value },
      update: {},
      create: { nombre: value },
    });
    return cat.id_categoria;
  }

  async create(createProductDto: CreateProductDto, file?: Express.Multer.File) {
    const { id_categoria, media, ...rest } = createProductDto;

    const resolvedCategory = await this.resolveCategoryId(id_categoria);
    
    const mediaInput = media || [];

    if (file) {
      const imageUrl = await this.uploadToCloudflare(file);
      mediaInput.unshift({ 
        url: imageUrl, 
        principal: true, 
        tipo: file.mimetype 
      });
    }

    const sanitizedMedia = this.sanitizeMediaPayload(mediaInput);

    const product = await this.prisma.producto.create({
      data: {
        ...rest,
        precio: Number(rest.precio),
        ...(resolvedCategory !== undefined && { id_categoria: resolvedCategory }),
        ...(sanitizedMedia.length > 0 && {
          producto_media: {
            create: sanitizedMedia,
          },
        }),
      },
      include: productInclude as unknown as Prisma.productoInclude,
    });

    return this.mapProduct(product as unknown as ProductWithRelations);
  }

  async findAll(params: { search?: string; status?: string; id_negocio?: string; categoria?: string }) {
    // ... (tu función findAll sin cambios)
    const { search, status, id_negocio, categoria } = params;
    const where: Prisma.productoWhereInput = {};

    let categoryFilter: bigint | undefined;
    const wantsUncategorized = categoria === '__none__';
    if (categoria && !wantsUncategorized) {
      try {
        categoryFilter = BigInt(categoria);
      } catch {
        throw new BadRequestException('categoria inválida');
      }
    }

    if (search) {
      where.nombre = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.estado = status;
    }
    if (wantsUncategorized) {
      where.id_categoria = { equals: null } as Prisma.BigIntNullableFilter;
    } else if (categoryFilter !== undefined) {
      where.id_categoria = categoryFilter;
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

    const products = (await this.prisma.producto.findMany({
      where,
      orderBy: { id_producto: 'desc' },
      include: productInclude as unknown as Prisma.productoInclude,
    })) as unknown as ProductWithRelations[];

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

  async listCategories(params: { id_negocio?: string }) {
    const { id_negocio } = params;
    const where: Prisma.productoWhereInput = {};

    let negocioIdFilter: bigint | undefined;
    if (id_negocio) {
      try {
        negocioIdFilter = BigInt(id_negocio);
      } catch {
        throw new BadRequestException('id_negocio inválido');
      }
    }

    if (negocioIdFilter !== undefined) {
      const inventoryRows = await this.prisma.inventario.findMany({
        where: { id_negocio: negocioIdFilter },
        select: { id_producto: true },
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
      select: {
        id_categoria: true,
        categoria: {
          select: { nombre: true },
        },
      },
    });

    if (products.length === 0) {
      return [];
    }

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
      if (b.total !== a.total) {
        return b.total - a.total;
      }
      return a.nombre.localeCompare(b.nombre);
    });

    return ordered.map((cat) => ({
      id: cat.id,
      nombre: cat.nombre,
      totalProductos: cat.total,
      value: cat.id ?? '__none__',
    }));
  }

  async findOne(id: string) {
    // ... (tu función findOne sin cambios)
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
    return this.mapProduct(product as unknown as ProductWithRelations, normalizedStock);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    // ... (tu función update sin cambios)
    // NOTA: Esta función 'update' NO está preparada para recibir un archivo,
    // solo para actualizar los datos JSON y las URLs de 'media'.
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
      include: productInclude as unknown as Prisma.productoInclude,
    });

    if (sanitizedMedia) {
      await this.replaceProductMedia(productId, sanitizedMedia);
      const refreshed = await this.fetchProductWithRelations(productId);
      if (!refreshed) {
        throw new NotFoundException(`Producto con ID #${id} no encontrado luego de actualizar media.`);
      }
      return this.mapProduct(refreshed as unknown as ProductWithRelations);
    }

    return this.mapProduct(product as unknown as ProductWithRelations);
  }

  async remove(id: string) {
    const productId = BigInt(id);

    await this.findOne(id);

    try {
      await this.prisma.$transaction(async (tx) => {
        const movimientoTable = await tx.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'movimientos_inventario'
          ) AS exists
        `;

        // If the product is referenced by sales/order details (detalle_venta or detalle_pedido)
        // we should avoid a destructive delete that would violate FK constraints.
        const referencedVenta = (await tx.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1 FROM detalle_venta WHERE id_producto = ${productId} LIMIT 1
          ) AS exists
        `)?.[0]?.exists;
        const referencedPedido = (await tx.$queryRaw<Array<{ exists: boolean }>>`
          SELECT EXISTS (
            SELECT 1 FROM detalle_pedido WHERE id_producto = ${productId} LIMIT 1
          ) AS exists
        `)?.[0]?.exists;

        if (referencedVenta || referencedPedido) {
          // Soft delete: no physical delete, mark as inactivo
          await tx.producto.update({ where: { id_producto: productId }, data: { estado: 'inactivo' } });
          return;
        }

        if (movimientoTable?.[0]?.exists) {
          await tx.$executeRaw`DELETE FROM movimientos_inventario WHERE id_producto = ${productId}`;
        }

        // Clean-up related artifacts: Inventario, media and metricas antes de borrar el producto
        await tx.producto_media.deleteMany({ where: { id_producto: productId } });
        await tx.producto_metricas_semanales.deleteMany({ where: { id_producto: productId } });
        await tx.inventario.deleteMany({ where: { id_producto: productId } });
        await tx.producto.delete({ where: { id_producto: productId } });
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        // Prisma client error code P2003: foreign key violation — as a safe fallback,
        // mark the product as inactivo instead of failing.
        try {
          await this.prisma.producto.update({ where: { id_producto: productId }, data: { estado: 'inactivo' } });
          return { message: `Producto con ID #${id} marcado como inactivo debido a dependencias.`, deleted: false };
        } catch (err) {
          throw new ConflictException('No se puede eliminar el producto porque tiene dependencias activas (ventas u otros registros).');
        }
      }
      throw e;
    }

    // Refresh the product to detect whether we performed a soft-delete
    const refreshed = await this.prisma.producto.findUnique({ where: { id_producto: productId } });
    if (!refreshed) {
      return { message: `Producto con ID #${id} eliminado correctamente.`, deleted: true };
    }
    if (refreshed.estado === 'inactivo') {
      return { message: `Producto con ID #${id} marcado como inactivo.`, deleted: false };
    }
    return { message: `Producto con ID #${id} eliminado correctamente.`, deleted: true };
  }

  private async uploadToCloudflare(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Archivo de imagen inválido o vacío.');
    }
    
    const accountId = this.configService.get<string>('CLOUDFLARE_ACCOUNT_ID');
    const apiToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN');
    
    if (!accountId || !apiToken) {
      throw new InternalServerErrorException('Configuración de Cloudflare no definida en el servidor.');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!file.mimetype || !allowed.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Usa JPG, PNG o WEBP.');
    }

    try {
      const form = new FormData();
      form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
      
      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
      const headers = { Authorization: `Bearer ${apiToken}`, ...form.getHeaders() };
      const response = await axios.post(url, form, { headers, maxBodyLength: 50 * 1024 * 1024 });
      const body = response.data;
      
      if (!body?.success) {
        const errMessage = body?.errors?.[0]?.message ?? 'Error al subir imagen a Cloudflare';
        throw new InternalServerErrorException(errMessage);
      }
      
      const variants = body.result?.variants;
      const imageUrl = Array.isArray(variants) && variants.length > 0 
        ? variants[0] 
        : body.result?.original_url ?? body.result?.uploadURL ?? null;
      
      if (!imageUrl) {
        throw new InternalServerErrorException('Cloudflare no devolvió una URL válida.');
      }
      
      return imageUrl;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al procesar la subida de imagen.');
    }
  }

  async uploadProductImage(id: string, file: Express.Multer.File) {
    const productId = BigInt(id);
    
    await this.findOne(id);
    
    const imageUrl = await this.uploadToCloudflare(file);
    
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO producto_media (id_producto, url, principal, tipo) VALUES ($1, $2, $3, $4)`,
      productId.toString(),
      imageUrl,
      false,
      file.mimetype,
    );
    
    const refreshed = await this.fetchProductWithRelations(productId);
    if (!refreshed) {
      throw new NotFoundException(`Producto con ID #${id} no encontrado después de actualizar imagen.`);
    }
    
    return this.mapProduct(refreshed as unknown as ProductWithRelations);
  }
}