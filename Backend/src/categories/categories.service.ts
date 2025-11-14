import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    const trimmedName = dto.nombre.trim();
    const prisma = this.prismaUnsafe;

    // 1. Validar duplicado global (mismo nombre ya asociado a TODOS los negocios del usuario?)
    const existing = await prisma.categoria.findFirst({ where: { nombre: trimmedName } });
    if (existing) {
      // Si aplica a todos y ya existe, simplemente vincular
      // Si no, también podemos vincular si no está ya asociado al negocio específico
      return await this.attachToBusinesses(userId, existing, dto);
    }

    // 2. Crear categoría global
    let created;
    try {
      created = await prisma.categoria.create({ data: { nombre: trimmedName } });
    } catch (e: unknown) {
      const code = this.extractPrismaCode(e);
      if (code === 'P2002') throw new BadRequestException('El nombre de categoría ya existe');
      throw e;
    }

    // 3. Asociar a negocios según flags
    await this.attachToBusinesses(userId, created, dto);
    return created;
  }

  async findAll(userId: string, negocioId?: string) {
    const prisma = this.prismaUnsafe;
    // Fallback: si el cliente Prisma aún no tiene el modelo (no migrado / no generado) devolver categorías globales.
    if (!prisma.negocio_categoria) {
      const globalCats = await prisma.categoria.findMany({ orderBy: { id_categoria: 'asc' } });
      return globalCats.map((c: any) => ({ id_categoria: c.id_categoria, nombre: c.nombre, negocio_id: null }));
    }

    const negocioIds = await this.resolveUserBusinessIds(userId);
    if (!negocioIds.length) {
      // Sin negocios: devolver globales (sin asociación) para no romper UI.
      const globalCats = await prisma.categoria.findMany({ orderBy: { id_categoria: 'asc' } });
      return globalCats.map((c: any) => ({ id_categoria: c.id_categoria, nombre: c.nombre, negocio_id: null }));
    }

    let targetIds = negocioIds;
    if (negocioId) {
      try {
        const parsed = this.safeBigInt(negocioId);
        if (negocioIds.includes(parsed)) targetIds = [parsed];
      } catch {
        // ignora negocioId inválido y usa todos
      }
    }

    const links = await prisma.negocio_categoria.findMany({
      where: { id_negocio: { in: targetIds } },
      include: { categoria: true },
      orderBy: { id_categoria: 'asc' },
    });

    // Si no hay enlaces (p.ej. después de migrar pero sin asociación) devolver globales para evitar lista vacía confusa.
    if (!links.length) {
      const globalCats = await prisma.categoria.findMany({ orderBy: { id_categoria: 'asc' } });
      return globalCats.map((c: any) => ({ id_categoria: c.id_categoria, nombre: c.nombre, negocio_id: null }));
    }

    return links.map((l: any) => ({
      id_categoria: l.id_categoria,
      nombre: l.categoria?.nombre,
      negocio_id: l.id_negocio,
    }));
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

  private safeBigInt(v: string | number | bigint): bigint {
    try {
      if (typeof v === 'bigint') return v;
      if (typeof v === 'number') return BigInt(v);
      return BigInt(String(v));
    } catch {
      throw new BadRequestException('Identificador inválido');
    }
  }

  private async resolveUserBusinessIds(userId: string): Promise<bigint[]> {
    const prisma = this.prismaUnsafe;
    const uid = this.safeBigInt(userId);
    const owned = await prisma.negocio.findMany({ where: { owner_id: uid } });
    const assigned = await prisma.usuarios_negocio.findMany({ where: { id_usuario: uid }, include: { negocio: true } });
    const ids: bigint[] = [];
    for (const n of owned) ids.push(this.safeBigInt(n.id_negocio));
    for (const a of assigned) if (a.negocio) ids.push(this.safeBigInt(a.negocio.id_negocio));
    return Array.from(new Set(ids));
  }

  private async attachToBusinesses(userId: string, categoria: any, dto: CreateCategoryDto) {
    const prisma = this.prismaUnsafe;
    const businessIds = await this.resolveUserBusinessIds(userId);
    if (!businessIds.length) return;

    let target: bigint[] = businessIds;
    if (dto.aplicarTodos) {
      // all businesses
      target = businessIds;
    } else if (dto.negocioId) {
      const parsed = this.safeBigInt(dto.negocioId);
      if (businessIds.includes(parsed)) target = [parsed];
      else throw new BadRequestException('negocioId no pertenece al usuario');
    } else if (dto.sucursal) {
      const name = dto.sucursal.trim().toLowerCase();
      const match = await prisma.negocio.findFirst({ where: { owner_id: this.safeBigInt(userId), nombre: { equals: dto.sucursal, mode: 'insensitive' } } });
      if (match) target = [this.safeBigInt(match.id_negocio)];
      else {
        // intentar entre asignados
        const assigned = await prisma.negocio.findFirst({ where: { nombre: { equals: dto.sucursal, mode: 'insensitive' }, OR: [{ owner_id: this.safeBigInt(userId) }] } });
        if (assigned) target = [this.safeBigInt(assigned.id_negocio)];
        else throw new NotFoundException('Sucursal no encontrada en negocios del usuario');
      }
    } else if (businessIds.length === 1) {
      target = businessIds; // único negocio
    } else {
      // Sin elección explícita y múltiples negocios: no asociar (requiere selección)
      throw new BadRequestException('Selecciona sucursal o usar aplicarTodos');
    }

    for (const bid of target) {
      try {
        // Si el modelo aún no existe (no migrado), simplemente continuar sin error.
        if (!prisma.negocio_categoria) return;
        await prisma.negocio_categoria.create({ data: { id_negocio: bid, id_categoria: this.safeBigInt(categoria.id_categoria) } });
      } catch (e: unknown) {
        const code = this.extractPrismaCode(e);
        if (code === 'P2002') {
          // ya existe vínculo, ignorar
        } else throw e;
      }
    }
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
