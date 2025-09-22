import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  correo_electronico: string;

  @IsNotEmpty()
  password: string;
}
