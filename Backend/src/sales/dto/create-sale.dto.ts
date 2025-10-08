import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested, ArrayMinSize, IsArray, MaxLength } from 'class-validator';
import { SaleItemDto } from './sale-item.dto';

export class CreateSaleDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : value))
  id_negocio!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : value))
  id_tipo_pago?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  cerrar?: boolean;
}
