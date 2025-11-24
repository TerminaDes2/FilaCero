import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RecoverResetDto {
  @IsString()
  @IsNotEmpty()
  session: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  passwordConfirm: string;
}
