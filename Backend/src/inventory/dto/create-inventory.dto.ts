import { IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsOptional()
  @IsString()
  id_negocio?: string; // bigint as string

  @IsOptional()
  @IsString()
  id_producto?: string; // bigint as string

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_minimo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cantidad_actual?: number;

  @IsOptional()
  @IsISO8601()
  fecha_actualizacion?: string; // ISO string
}
