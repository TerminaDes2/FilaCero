import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }): string => {
    if (typeof value !== 'string') return '';
    const digits = value.replace(/\D+/g, ''); // solo números
    // Si viene con 12 dígitos y empieza por 52 (E.164 MX sin '+')
    if (digits.startsWith('52') && digits.length === 12) return `+${digits}`;
    // Si viene con 10 dígitos locales, prefijamos +52
    if (digits.length === 10) return `+52${digits}`;
    // Si ya viene con +52 y 10 dígitos, respetamos
    const trimmed = value.trim();
    if (/^\+52\d{10}$/.test(trimmed)) return trimmed;
    return trimmed; // dejar que la validación falle con mensaje claro
  })
  @Matches(/^\+52\d{10}$/, {
    message: 'El teléfono debe ser de México (+52) con 10 dígitos, ej: +523001112233',
  })
  telefono!: string;

  @IsOptional()
  @IsString()
  canal?: 'sms' | 'call';
}
