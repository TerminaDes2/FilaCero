import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class ProductMediaInputDto {
  @IsUrl({}, { message: 'La URL de la media debe ser válida' })
  @MaxLength(2048)
  url!: string;

  @IsOptional()
  @IsBoolean()
  principal?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  tipo?: string;
}
