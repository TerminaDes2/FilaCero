import { IsEnum, IsOptional } from 'class-validator';

export class UpdateEmployeeDto {
  @IsEnum(['activo', 'inactivo'])
  @IsOptional()
  estado?: 'activo' | 'inactivo';
}
