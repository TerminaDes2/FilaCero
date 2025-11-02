import { IsInt, Max, Min, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBusinessRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  estrellas!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}
