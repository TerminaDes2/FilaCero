import { IsEmail, IsNotEmpty, MinLength, IsString, IsIn, IsOptional, Matches, IsInt, Min, Max } from 'class-validator';
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

  @IsOptional()
  @IsString({ message: 'El número de cuenta debe ser una cadena de texto' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[0-9]{5,20}$/, {
    message: 'El número de cuenta debe contener entre 5 y 20 dígitos',
  })
  accountNumber?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : Number(value)))
  @IsInt({ message: 'La edad debe ser un número entero' })
  @Min(16, { message: 'La edad mínima permitida es 16' })
  @Max(120, { message: 'La edad máxima permitida es 120' })
  age?: number;
}