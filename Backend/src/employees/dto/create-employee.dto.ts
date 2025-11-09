import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsEmail()
  @IsNotEmpty()
  correo_electronico: string;

  @IsString()
  @IsOptional()
  nombre?: string;
}
