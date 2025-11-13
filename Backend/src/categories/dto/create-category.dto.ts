import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;
  
  @IsOptional()
  @IsString()
  negocioId?: string;

  // Nombre de sucursal (negocio.nombre) si el usuario tiene múltiples
  @IsOptional()
  @IsString()
  sucursal?: string;

  // Marcar para aplicar a todos los negocios asociados al usuario
  @IsOptional()
  aplicarTodos?: boolean;
}
