import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'ID del PaymentIntent de Stripe (pi_xxx)',
    example: 'pi_3abc123xyz',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;

  @ApiPropertyOptional({
    description: 'Últimos 4 dígitos de la tarjeta usada (opcional)',
    example: '4242',
    type: String,
  })
  @IsOptional()
  @IsString()
  last4?: string;

  @ApiPropertyOptional({
    description: 'Marca de la tarjeta (visa, mastercard, etc.) (opcional)',
    example: 'visa',
    type: String,
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  cardType?: string;
}
