import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SaleItemDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : value))
  id_producto!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio_unitario?: number;
}
