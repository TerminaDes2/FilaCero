import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    const trimmedName = dto.nombre.trim();
    
    // Por ahora, las categorías son globales (el schema no tiene negocio_id)
    const prisma = this.prismaUnsafe;
    const duplicate = await prisma.categoria.findFirst({
      where: {
        nombre: trimmedName,
      },
    });
    if (duplicate) {
      throw new BadRequestException('Ya existe una categoría con ese nombre');
    }
    try {
      return await prisma.categoria.create({
        data: {
          nombre: trimmedName,
        },
      });
    } catch (e: unknown) {
      const code = this.extractPrismaCode(e);
      if (code === 'P2002') {
        throw new BadRequestException('El nombre de categoría ya existe');
      }
      throw e;
    }
  }

  async findAll(userId: string, negocioId?: string) {
    // Las categorías son globales, retornar todas
    const prisma = this.prismaUnsafe;
    return prisma.categoria.findMany({
      orderBy: { id_categoria: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const prisma = this.prismaUnsafe;
    const categoryId = this.parseBigInt(id, 'Categoría inválida');
    const item = await prisma.categoria.findUnique({ where: { id_categoria: categoryId } });
    if (!item) throw new NotFoundException('Categoría no encontrada');
    return item;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const categoryId = this.parseBigInt(id, 'Categoría inválida');
    const prisma = this.prismaUnsafe;
    const categoria = await prisma.categoria.findUnique({ where: { id_categoria: categoryId } });
    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }
    
    const data: Record<string, unknown> = {};
    if (dto.nombre) {
      const trimmed = dto.nombre.trim();
      const duplicate = await prisma.categoria.findFirst({
        where: {
          nombre: trimmed,
          NOT: { id_categoria: categoryId },
        },
      });
      if (duplicate) {
        throw new BadRequestException('Ya existe una categoría con ese nombre');
      }
      data.nombre = trimmed;
    }
    try {
      return await prisma.categoria.update({
        where: { id_categoria: categoryId },
        data,
      });
    } catch (e: unknown) {
      const code = this.extractPrismaCode(e);
      if (code === 'P2025') {
        throw new NotFoundException('Categoría no encontrada');
      }
      if (code === 'P2002') {
        throw new BadRequestException('El nombre de categoría ya existe');
      }
      throw e;
    }
  }

  async remove(userId: string, id: string) {
    const categoryId = this.parseBigInt(id, 'Categoría inválida');
    const prisma = this.prismaUnsafe;
    const categoria = await prisma.categoria.findUnique({ where: { id_categoria: categoryId } });
    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }
    
    try {
      await prisma.categoria.delete({ where: { id_categoria: categoryId } });
      return { deleted: true };
    } catch (e: unknown) {
      const code = this.extractPrismaCode(e);
      if (code === 'P2025') {
        throw new NotFoundException('Categoría no encontrada');
      }
      throw e;
    }
  }

  private extractPrismaCode(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === 'string' ? maybeCode : undefined;
  }

  private get prismaUnsafe() {
    return this.prisma as any;
  }

  private parseBigInt(value: string | number | bigint, message: string): bigint {
    try {
      if (typeof value === 'bigint') return value;
      if (typeof value === 'number') return BigInt(value);
      return BigInt(value);
    } catch {
      throw new BadRequestException(message);
    }
  }
}
