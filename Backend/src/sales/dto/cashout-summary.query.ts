import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CashoutSummaryQueryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : value))
  id_negocio!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha_inicio?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha_fin?: Date;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  incluir_recientes?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1)
  limite_recientes?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  todo_el_dia?: boolean;
}
