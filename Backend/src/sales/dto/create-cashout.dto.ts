import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCashoutDto {
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
  @Min(0)
  monto_inicial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  monto_final?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  todo_el_dia?: boolean;
}
