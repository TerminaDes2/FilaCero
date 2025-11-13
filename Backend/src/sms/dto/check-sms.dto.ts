import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CheckSmsDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }): string => {
    if (typeof value !== 'string') return '';
    const digits = value.replace(/\D+/g, '');
    if (digits.startsWith('52') && digits.length === 12) return `+${digits}`;
    if (digits.length === 10) return `+52${digits}`;
    const trimmed = value.trim();
    if (/^\+52\d{10}$/.test(trimmed)) return trimmed;
    return trimmed;
  })
  @Matches(/^\+52\d{10}$/, { message: 'El teléfono debe ser de México (+52) con 10 dígitos, ej: +523001112233' })
  telefono!: string;

  @IsString()
  @IsNotEmpty()
  codigo!: string;
}
