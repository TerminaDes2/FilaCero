import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  nombre?: string;
}
