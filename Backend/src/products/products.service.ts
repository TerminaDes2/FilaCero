import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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
    const { id_categoria, ...rest } = createProductDto;

    const resolvedCategory = await this.resolveCategoryId(id_categoria);

    return this.prisma.producto.create({
      data: {
        ...rest,
        ...(resolvedCategory !== undefined && { id_categoria: resolvedCategory }),
      },
    });
  }

  findAll(params: { search?: string; status?: string }) {
  const { search, status } = params;
  const where: Prisma.productoWhereInput = {};

  if (search) {
    where.nombre = { contains: search, mode: 'insensitive' };
  }
  if (status) {
    where.estado = status;
  }

  return this.prisma.producto.findMany({
    where,
    orderBy: { id_producto: 'desc' },
  });
}

  async findOne(id: string) {
    // Convertimos el ID a BigInt para la consulta
    const productId = BigInt(id);

    const product = await this.prisma.producto.findUnique({
      where: { id_producto: productId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID #${id} no encontrado`);
    }
    return product;
  }

  // ✅ Lógica de actualización corregida.
  async update(id: string, updateProductDto: UpdateProductDto) {
    const { id_categoria, ...rest } = updateProductDto;
    const productId = BigInt(id);

    const resolvedCategory = await this.resolveCategoryId(id_categoria);

    return this.prisma.producto.update({
      where: { id_producto: productId },
      data: {
        ...rest,
        ...(resolvedCategory !== undefined && { id_categoria: resolvedCategory }),
      },
    });
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