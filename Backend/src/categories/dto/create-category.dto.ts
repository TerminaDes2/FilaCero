import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;
  
  @IsOptional()
  @IsString()
  negocioId?: string;
}
