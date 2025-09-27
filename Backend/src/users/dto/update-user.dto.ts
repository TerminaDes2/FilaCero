import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name?: string; // Corresponde al campo 'nombre' en la DB

  @IsOptional()
  @IsString({ message: 'El número de teléfono debe ser una cadena de texto' })
  phoneNumber?: string; // Corresponde al campo 'numero_telefono' en la DB

  @IsOptional()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  newPassword?: string; // Se hashea en el servicio si se proporciona
}