import { Transform } from 'class-transformer';
import { IsString, IsOptional, MinLength, IsUrl, Matches, IsInt, Min, Max } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'El número de teléfono debe ser una cadena de texto' })
  phoneNumber?: string; // Corresponde a numero_telefono en tu DB

  @IsOptional()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  newPassword?: string; // Si se cambia la contraseña

  @IsOptional()
  @IsUrl({}, { message: 'El avatar debe ser una URL válida' })
  avatarUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'La credencial debe ser una URL válida' })
  credentialUrl?: string;

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

  // Nota: El correo electrónico (correo_electronico) generalmente no se permite cambiar fácilmente 
  // por seguridad o requiere un proceso de doble confirmación.
}