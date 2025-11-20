import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SavePaymentMethodDto {
  @ApiProperty({
    description: 'ID del PaymentMethod de Stripe (pm_xxx generado con Elements)',
    example: 'pm_1abc123xyz',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Tipo de método de pago (tarjeta, spei, etc.)',
    example: 'tarjeta',
    type: String,
  })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({
    description: 'Marca de la tarjeta (visa, mastercard, amex)',
    example: 'visa',
    type: String,
  })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiProperty({
    description: 'Últimos 4 dígitos de la tarjeta',
    example: '4242',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  last4: string;

  @ApiPropertyOptional({
    description: 'Mes de expiración (1-12)',
    example: 12,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  expMonth?: number;

  @ApiPropertyOptional({
    description: 'Año de expiración (YYYY)',
    example: 2025,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  expYear?: number;

  @ApiPropertyOptional({
    description: 'Nombre del titular de la tarjeta',
    example: 'Juan Pérez',
    type: String,
  })
  @IsOptional()
  @IsString()
  cardholderName?: string;

  @ApiPropertyOptional({
    description: 'Marcar como método de pago por defecto',
    example: true,
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
