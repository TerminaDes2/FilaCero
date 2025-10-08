import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseSaleDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value).trim() : value))
  id_tipo_pago?: string;
}
