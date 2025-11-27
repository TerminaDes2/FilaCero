import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class TranslateDto {
  @IsArray()
  @ArrayMinSize(1)
  texts!: string[];

  @IsString()
  to!: string;
}
