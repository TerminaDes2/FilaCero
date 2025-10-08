import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const { id_categoria, ...rest } = createProductDto;
    const categoriaId = this.toBigInt(id_categoria);

    try {
      return await this.prisma.producto.create({
        data: {
          ...rest,
          ...(categoriaId !== undefined ? { id_categoria: categoriaId } : {}),
        },
      });
    } catch (error) {
      this.handleKnownError(error, {
        unique: 'El código de barras ya está registrado para otro producto.',
        foreignKey: 'La categoría asociada no existe.',
      });
    }
  }

  findAll(params: { search?: string; status?: string }) {
    const { search, status } = params;
    const where: Prisma.productoWhereInput = {};

    if (search?.trim()) {
      where.nombre = { contains: search.trim(), mode: 'insensitive' };
    }
    if (status?.trim()) {
      where.estado = status.trim();
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
    const categoriaId = this.toBigInt(id_categoria);

    try {
      return await this.prisma.producto.update({
        where: { id_producto: productId },
        data: {
          ...rest,
          ...(categoriaId !== undefined ? { id_categoria: categoriaId } : {}),
        },
      });
    } catch (error) {
      this.handleKnownError(error, {
        unique: 'El código de barras ya está registrado para otro producto.',
        notFound: `Producto con ID #${id} no encontrado`,
        foreignKey: 'La categoría asociada no existe.',
      });
    }
  }

  async remove(id: string) {
    const productId = BigInt(id);

    // Verificar existencia previa para devolver 404 coherente
    await this.findOne(id);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.movimientos_inventario.deleteMany({ where: { id_producto: productId } });
        await tx.inventario.deleteMany({ where: { id_producto: productId } });
        await tx.producto.delete({ where: { id_producto: productId } });
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        // Existen registros dependientes (p.ej. ventas) que impiden eliminarlo
        throw new ConflictException('No se puede eliminar el producto porque tiene dependencias activas (ventas u otros registros).');
      }
      throw error;
    }

    return { message: `Producto con ID #${id} eliminado correctamente.`, deleted: true };
  }

  private toBigInt(value?: string | number | null): bigint | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return BigInt(value);
  }

  private extractPrismaCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }
    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === 'string' ? maybeCode : undefined;
  }

  private handleKnownError(
    error: unknown,
    messages: { unique?: string; notFound?: string; foreignKey?: string },
  ): never {
    const code = this.extractPrismaCode(error);

    if (code === 'P2002' && messages.unique) {
      throw new ConflictException(messages.unique);
    }

    if (code === 'P2025' && messages.notFound) {
      throw new NotFoundException(messages.notFound);
    }

    if (code === 'P2003' && messages.foreignKey) {
      throw new BadRequestException(messages.foreignKey);
    }

    throw error;
  }
}