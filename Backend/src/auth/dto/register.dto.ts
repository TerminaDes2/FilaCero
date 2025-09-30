import { IsEmail, IsNotEmpty, MinLength, IsString, IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string; // Se mapeará a 'nombre' en la DB

  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string; // Se mapeará a 'correo_electronico' en la DB

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string; // Se mapeará a 'password_hash' en la DB

  // Rol opcional controlado desde el frontend (solo permitido: 'usuario' o 'admin')
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsIn(['usuario', 'admin'], { message: 'Rol inválido' })
  role?: 'usuario' | 'admin';
}