import { IsEmail, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  correo_electronico: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  numero_telefono?: string;
}
