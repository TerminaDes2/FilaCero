import { IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export enum EstadoPedido {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  EN_PREPARACION = 'en_preparacion',
  LISTO = 'listo',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

export class UpdateEstadoPedidoDto {
  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsEnum(EstadoPedido, {
    message: `El estado debe ser uno de: ${Object.values(EstadoPedido).join(', ')}`,
  })
  estado: EstadoPedido;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notas?: string;
}

export class UpdatePedidoDto {
  @IsOptional()
  @IsString({ message: 'El nombre_cliente debe ser texto' })
  nombre_cliente?: string;

  @IsOptional()
  @IsString({ message: 'El email_cliente debe ser texto' })
  email_cliente?: string;

  @IsOptional()
  @IsString({ message: 'El telefono_cliente debe ser texto' })
  telefono_cliente?: string;

  @IsOptional()
  @IsString({ message: 'Las notas_cliente deben ser texto' })
  notas_cliente?: string;

  @IsOptional()
  @IsString({ message: 'El tiempo_entrega debe ser texto' })
  tiempo_entrega?: string;
}
