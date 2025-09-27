import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string; // Se mapeará a 'nombre' en la DB

  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  email: string; // Se mapeará a 'correo_electronico' en la DB

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string; // Se mapeará a 'password_hash' en la DB
}