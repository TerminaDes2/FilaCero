// backend/src/businesses/dto/create-business.dto.ts
import { IsEmail, IsOptional, IsString, IsUrl, MinLength, MaxLength } from 'class-validator';

export class CreateBusinessDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El logo debe ser una URL válida' })
  @MaxLength(2048)
  logo?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El logo debe ser una URL válida' })
  @MaxLength(2048)
  logo_url?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La imagen principal debe ser una URL válida' })
  @MaxLength(2048)
  hero_image_url?: string;
}