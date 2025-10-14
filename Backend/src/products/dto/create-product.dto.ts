import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductMediaInputDto } from './product-media.dto';

export class CreateProductDto {
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  descripcion_larga?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  codigo_barras?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precio!: number;

  @IsOptional()
  @IsString()
  imagen_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  estado?: string;

  @IsOptional()
  @IsString()
  id_categoria?: string; // BigInt id as string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMediaInputDto)
  media?: ProductMediaInputDto[];
}