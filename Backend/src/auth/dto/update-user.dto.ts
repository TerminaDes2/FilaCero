import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';

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

  // Nota: El correo electrónico (correo_electronico) generalmente no se permite cambiar fácilmente 
  // por seguridad o requiere un proceso de doble confirmación.
}