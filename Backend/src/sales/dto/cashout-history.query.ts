import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CashoutHistoryQueryDto {
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
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1)
  @Max(30)
  limite?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  incluir_recientes?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(1)
  @Max(20)
  limite_recientes?: number;
}
