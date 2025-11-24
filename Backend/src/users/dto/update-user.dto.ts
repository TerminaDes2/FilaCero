import { IsString, IsOptional, MinLength, IsInt } from 'class-validator';

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

  @IsOptional()
  @IsString({ message: 'La URL del avatar debe ser una cadena de texto' })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: 'La URL de credencial debe ser una cadena de texto' })
  credentialUrl?: string;

  @IsOptional()
  @IsString({ message: 'El número de cuenta debe ser una cadena de texto' })
  accountNumber?: string;

  @IsOptional()
  @IsInt({ message: 'La edad debe ser un número entero' })
  age?: number;
}