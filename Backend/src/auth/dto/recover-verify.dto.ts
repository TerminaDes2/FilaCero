import { IsNotEmpty, IsString } from 'class-validator';

export class RecoverVerifyDto {
  @IsString()
  @IsNotEmpty()
  session: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
