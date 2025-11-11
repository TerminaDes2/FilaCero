import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'El token de verificación es obligatorio' })
  @Length(6, 6, { message: 'El token debe contener 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'El token solo puede contener números' })
  token!: string;
}
