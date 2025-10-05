import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCategoryDto) {
    return this.prisma.categoria.create({ data: { nombre: dto.nombre.trim() } });
  }

  findAll() {
    return this.prisma.categoria.findMany({ orderBy: { id_categoria: 'asc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.categoria.findUnique({ where: { id_categoria: BigInt(id) } });
    if (!item) throw new NotFoundException('Categoría no encontrada');
    return item;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    try {
      return await this.prisma.categoria.update({ where: { id_categoria: BigInt(id) }, data: { ...dto, ...(dto.nombre ? { nombre: dto.nombre.trim() } : {}) } });
    } catch (e: any) {
      if (e instanceof (Prisma as any).PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Categoría no encontrada');
      }
      if (e instanceof (Prisma as any).PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('El nombre de categoría ya existe');
      }
      throw e;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.categoria.delete({ where: { id_categoria: BigInt(id) } });
      return { deleted: true };
    } catch (e: any) {
      if (e instanceof (Prisma as any).PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Categoría no encontrada');
      }
      throw e;
    }
  }
}
