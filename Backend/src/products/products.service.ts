import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateProductDto) {
    const prisma = this.prisma as any;
    return prisma.producto.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        codigo_barras: data.codigo_barras,
        precio: data.precio as any,
        imagen: data.imagen,
        estado: data.estado,
        id_categoria: data.id_categoria ? BigInt(data.id_categoria) : undefined,
      },
    });
  }

  findAll() {
    const prisma = this.prisma as any;
    return prisma.producto.findMany({ orderBy: { id_producto: 'desc' } });
  }

  async findOne(id: string) {
    const prisma = this.prisma as any;
    const prod = await prisma.producto.findUnique({ where: { id_producto: BigInt(id) } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    return prod;
  }

  update(id: string, data: UpdateProductDto) {
    const prisma = this.prisma as any;
    return prisma.producto.update({
      where: { id_producto: BigInt(id) },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        codigo_barras: data.codigo_barras,
        precio: data.precio as any,
        imagen: data.imagen,
        estado: data.estado,
        id_categoria: data.id_categoria ? BigInt(data.id_categoria) : undefined,
      },
    });
  }

  async remove(id: string) {
    const prisma = this.prisma as any;
    await prisma.producto.delete({ where: { id_producto: BigInt(id) } });
    return { deleted: true };
  }
}
