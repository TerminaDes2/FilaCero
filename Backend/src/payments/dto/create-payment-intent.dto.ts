import { IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'ID del pedido a pagar (bigint como string en JSON)',
    example: '12345',
    type: String,
  })
  @IsNotEmpty()
  @Type(() => BigInt)
  pedidoId: bigint;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales para Stripe (opcional)',
    example: { origen: 'mobile_app', promo: 'WELCOME10' },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
