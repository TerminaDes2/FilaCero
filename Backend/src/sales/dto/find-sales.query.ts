import { Transform, Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const SALE_STATUSES = ['abierta', 'pagada', 'cancelada', 'devuelta'] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export class FindSalesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : value))
  id_negocio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : value))
  id_usuario?: string;

  @IsOptional()
  @IsString()
  @IsIn(SALE_STATUSES)
  estado?: SaleStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  desde?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  hasta?: Date;
}
