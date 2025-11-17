import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyRegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio' })
  @Length(6, 6, { message: 'El código debe contener 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'El código solo puede contener números' })
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'La sesión de verificación es obligatoria' })
  session!: string;
}
