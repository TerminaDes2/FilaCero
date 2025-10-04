import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ✅ Más simple y seguro, sin 'as any'.
  create(createProductDto: CreateProductDto) {
    const { id_categoria, ...rest } = createProductDto;

    return this.prisma.producto.create({
      data: {
        ...rest, // Usamos todas las demás propiedades del DTO
        // Convertimos id_categoria solo si existe
        ...(id_categoria && { id_categoria: BigInt(id_categoria) }),
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
  update(id: string, updateProductDto: UpdateProductDto) {
    const { id_categoria, ...rest } = updateProductDto;
    const productId = BigInt(id);

    return this.prisma.producto.update({
      where: { id_producto: productId },
      data: {
        ...rest,
        // Actualizamos id_categoria solo si se proporciona en el DTO
        ...(id_categoria && { id_categoria: BigInt(id_categoria) }),
      },
    });
  }

  async remove(id: string) {
    const productId = BigInt(id);
    
    // Es buena práctica verificar que el producto existe antes de borrarlo.
    await this.findOne(id);

    await this.prisma.producto.delete({
      where: { id_producto: productId },
    });
    
    return { message: `Producto con ID #${id} eliminado correctamente.`, deleted: true };
  }
}