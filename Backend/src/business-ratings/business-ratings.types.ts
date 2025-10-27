export interface BusinessRatingUserDto {
  id: string;
  nombre: string;
  avatarUrl: string | null;
}

export interface BusinessRatingResponseDto {
  id: number;
  businessId: number;
  user: BusinessRatingUserDto;
  estrellas: number;
  comentario: string | null;
  createdAt: string;
}

export interface RatingsListMetaDto {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface RatingsListResultDto {
  items: BusinessRatingResponseDto[];
  meta: RatingsListMetaDto;
}

export interface RatingsSummaryDto {
  average: number;
  total: number;
  distribution: Record<string, number>;
}
