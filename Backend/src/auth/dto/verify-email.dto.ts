import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'El token de verificación es obligatorio' })
  @MaxLength(128)
  token!: string;
}
