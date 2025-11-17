import { IsNotEmpty, IsString } from 'class-validator';

export class ResendRegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'La sesión de verificación es obligatoria' })
  session!: string;
}
