import { IsNotEmpty, IsString } from 'class-validator';

export class RecoverRequestDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // correo o teléfono (preferible E.164 para teléfono)
}
