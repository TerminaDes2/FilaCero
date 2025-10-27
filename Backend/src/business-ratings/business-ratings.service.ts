import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessRatingDto } from './dto/create-business-rating.dto';
import { UpdateBusinessRatingDto } from './dto/update-business-rating.dto';
import {
  BusinessRatingResponseDto,
  RatingsListResultDto,
  RatingsSummaryDto,
} from './business-ratings.types';

const MAX_PAGE_SIZE = 50;

const ratingInclude: any = {
  usuarios: {
    select: {
      id_usuario: true,
      nombre: true,
      avatar_url: true,
    },
  },
};

@Injectable()
export class BusinessRatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertRating(
    businessId: string,
    userId: string,
    dto: CreateBusinessRatingDto,
  ): Promise<BusinessRatingResponseDto> {
    const negocioId = this.parseBigInt(businessId, 'Negocio inválido');
    const usuarioId = this.parseBigInt(userId, 'Usuario inválido');
    const cleanComment = dto.comentario?.trim() || null;

    const rating = await this.prisma.negocio_rating.upsert({
      include: ratingInclude,
      where: {
        id_negocio_id_usuario: {
          id_negocio: negocioId,
          id_usuario: usuarioId,
        },
      },
      create: {
        id_negocio: negocioId,
        id_usuario: usuarioId,
        estrellas: dto.estrellas,
        comentario: cleanComment,
      },
      update: {
        estrellas: dto.estrellas,
        comentario: cleanComment,
      },
    });

    return this.serializeRating(rating);
  }

  async updateRating(
    businessId: string,
    ratingId: string,
    userId: string,
    dto: UpdateBusinessRatingDto,
    isPrivileged: boolean,
  ): Promise<BusinessRatingResponseDto> {
    const negocioId = this.parseBigInt(businessId, 'Negocio inválido');
    const targetId = this.parseBigInt(ratingId, 'Valoración inválida');
    const usuarioId = this.parseBigInt(userId, 'Usuario inválido');

    const existing = await this.prisma.negocio_rating.findUnique({
      where: { id_rating: targetId },
      select: {
        id_rating: true,
        id_negocio: true,
        id_usuario: true,
      },
    });

    if (!existing || existing.id_negocio !== negocioId) {
      throw new NotFoundException('Valoración no encontrada');
    }

    if (existing.id_usuario !== usuarioId && !isPrivileged) {
      throw new ForbiddenException('No puedes editar esta valoración');
    }

    const cleanComment = dto.comentario?.trim();

    const updated = await this.prisma.negocio_rating.update({
      include: ratingInclude,
      where: { id_rating: existing.id_rating },
      data: {
        estrellas: dto.estrellas ?? undefined,
        comentario:
          cleanComment !== undefined ? cleanComment || null : undefined,
      },
    });

    return this.serializeRating(updated);
  }

  async listRatings(
    businessId: string,
    page = 1,
    limit = 10,
  ): Promise<RatingsListResultDto> {
    const negocioId = this.parseBigInt(businessId, 'Negocio inválido');
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), MAX_PAGE_SIZE);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;
    const where = { id_negocio: negocioId };

    const [itemsRaw, total] = await this.prisma.$transaction([
      this.prisma.negocio_rating.findMany({
        include: ratingInclude,
        where,
        orderBy: { creado_en: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.negocio_rating.count({ where }),
    ]);

    return {
      items: itemsRaw.map((item) => this.serializeRating(item)),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: total ? Math.ceil(total / safeLimit) : 1,
      },
    };
  }

  async getSummary(businessId: string): Promise<RatingsSummaryDto> {
    const negocioId = this.parseBigInt(businessId, 'Negocio inválido');

    const [aggregate, distribution] = await this.prisma.$transaction([
      this.prisma.negocio_rating.aggregate({
        where: { id_negocio: negocioId },
        _avg: { estrellas: true },
        _count: { _all: true },
      }),
      (this.prisma.negocio_rating as any).groupBy({
        where: { id_negocio: negocioId } as any,
        by: ['estrellas'],
        _count: { _all: true },
      }),
    ]);

    const totals: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };

    (distribution as Array<{ estrellas: number; _count: { _all: number } }>).forEach((group) => {
      totals[group.estrellas.toString()] = group._count._all;
    });

    return {
      average: Number(aggregate._avg.estrellas ?? 0),
      total: aggregate._count._all,
      distribution: totals,
    };
  }

  async removeRating(
    businessId: string,
    ratingId: string,
    userId: string,
    isPrivileged: boolean,
  ) {
    const negocioId = this.parseBigInt(businessId, 'Negocio inválido');
    const targetId = this.parseBigInt(ratingId, 'Valoración inválida');
    const usuarioId = this.parseBigInt(userId, 'Usuario inválido');

    const rating = await this.prisma.negocio_rating.findUnique({
      where: { id_rating: targetId },
      select: {
        id_rating: true,
        id_negocio: true,
        id_usuario: true,
      },
    });

    if (!rating || rating.id_negocio !== negocioId) {
      throw new NotFoundException('Valoración no encontrada');
    }

    if (rating.id_usuario !== usuarioId && !isPrivileged) {
      throw new ForbiddenException('No puedes eliminar esta valoración');
    }

    await this.prisma.negocio_rating.delete({ where: { id_rating: rating.id_rating } });

    return { deleted: true };
  }

  private serializeRating(rating: any): BusinessRatingResponseDto {
    if (!rating.usuarios) {
      throw new NotFoundException('Usuario asociado a la valoración no encontrado');
    }

    return {
      id: Number(rating.id_rating),
      businessId: Number(rating.id_negocio),
      user: {
        id: rating.usuarios.id_usuario.toString(),
        nombre: rating.usuarios.nombre,
        avatarUrl: rating.usuarios.avatar_url ?? null,
      },
      estrellas: rating.estrellas,
      comentario: rating.comentario ?? null,
      createdAt: rating.creado_en.toISOString(),
    };
  }

  private parseBigInt(value: string | number | bigint, message: string): bigint {
    try {
      if (typeof value === 'bigint') {
        return value;
      }

      if (typeof value === 'number') {
        return BigInt(value);
      }

      return BigInt(value);
    } catch {
      throw new BadRequestException(message);
    }
  }
}
