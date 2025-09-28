import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @MaxLength(200)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  codigo_barras?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precio!: number;

  @IsOptional()
  @IsString()
  imagen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  estado?: string;

  @IsOptional()
  @IsString()
  id_categoria?: string; // BigInt id as string
}