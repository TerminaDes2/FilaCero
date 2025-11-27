import { Controller, Post, Param, Body, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { SetProductImageDto } from './dto/set-product-image.dto';

@Controller('api/products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductImagesController {
  constructor(private prisma: PrismaService) {}

  @Post(':id/image-url')
  @Roles('admin', 'superadmin')
  async setImageUrl(@Param('id') id: string, @Body() body: SetProductImageDto) {
    if (!body || !body.imageUrl) {
      throw new BadRequestException('Se requiere `imageUrl` en el body.');
    }
    const imageUrl = body.imageUrl.trim();
    if (!/^https?:\/\//i.test(imageUrl)) {
      throw new BadRequestException('La URL debe ser absoluta y comenzar con http(s)://');
    }
    const productId = BigInt(id);

    // Ensure product exists
    const existing: any = await this.prisma.producto.findUnique({ where: { id_producto: productId } });
    if (!existing) {
      throw new NotFoundException(`Producto con ID #${id} no encontrado.`);
    }

    // Run DB transaction: update product imagen_url, ensure producto_media highlights the given url as principal
    const updatedProduct: any = await this.prisma.$transaction(async (tx: any) => {
      // Update imagen_url on producto
      await tx.producto.update({ where: { id_producto: productId }, data: { imagen_url: imageUrl } });

      // Set previous principal flags to false
      await tx.producto_media.updateMany({ where: { id_producto: productId, principal: true }, data: { principal: false } });

      // If media with same URL exists -> mark it as principal
      const found: any = await tx.producto_media.findFirst({ where: { id_producto: productId, url: imageUrl } });
      if (found) {
        await tx.producto_media.update({ where: { id_media: found.id_media }, data: { principal: true } });
      } else {
        // Create a new media entry
        await tx.producto_media.create({ data: { id_producto: productId, url: imageUrl, principal: true, tipo: null } });
      }

      // Return product with relations
      return tx.producto.findUnique({ where: { id_producto: productId }, include: { categoria: true, producto_media: { orderBy: [{ principal: 'desc' }, { creado_en: 'desc' }] }, producto_metricas_semanales: { orderBy: { calculado_en: 'desc' }, take: 8 } } });
    });

    if (!updatedProduct) {
      throw new NotFoundException(`Producto con ID #${id} no encontrado luego de actualizar.`);
    }

    // Map basic product for response similar to ProductsService.mapProduct
    const mapProduct = (product: any, stock: number | null = null) => {
      const mediaList = (product.producto_media || []).map((m) => ({ id_media: m.id_media.toString(), url: m.url, principal: m.principal, tipo: m.tipo, creado_en: m.creado_en?.toISOString() ?? null }));
      const metrics = (product.producto_metricas_semanales || []).map((m) => ({ id_metricas: m.id_metricas.toString(), id_negocio: m.id_negocio ? m.id_negocio.toString() : null, anio: m.anio, semana: m.semana, cantidad: m.cantidad, calculado_en: m.calculado_en?.toISOString() ?? null }));
      const popularity = metrics.reduce((acc, i) => acc + (i.cantidad || 0), 0);
      return {
        id_producto: product.id_producto.toString(),
        id_categoria: product.id_categoria ? product.id_categoria.toString() : null,
        nombre: product.nombre,
        descripcion: product.descripcion,
        descripcion_larga: product.descripcion_larga,
        codigo_barras: product.codigo_barras,
        precio: Number(product.precio ?? 0),
        imagen_url: product.imagen_url ?? null,
        estado: product.estado ?? null,
        media: mediaList,
        metricas: metrics,
        stock,
        popularity,
      };
    };

    const stockAgg = await this.prisma.inventario.aggregate({ _sum: { cantidad_actual: true }, where: { id_producto: productId } });
    const normalizedStock = stockAgg._sum.cantidad_actual == null ? null : Number(stockAgg._sum.cantidad_actual);

    return mapProduct(updatedProduct, normalizedStock);
  }
}
