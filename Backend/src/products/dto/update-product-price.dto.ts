import { IsOptional, IsPositive, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductPriceDto {
  @IsPositive({ message: 'El precio debe ser un valor positivo' })
  @Type(() => Number)
  precio: number;

  @IsOptional()
  @MaxLength(200, { message: 'El motivo no puede exceder 200 caracteres' })
  motivo?: string;
}
