import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEmail,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateDetallePedidoDto {
  @IsNotEmpty({ message: 'El id_producto es requerido' })
  @IsNumber({}, { message: 'El id_producto debe ser un número' })
  id_producto: number;

  @IsNotEmpty({ message: 'La cantidad es requerida' })
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;

  @IsNotEmpty({ message: 'El precio_unitario es requerido' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio_unitario debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El precio_unitario debe ser mayor o igual a 0' })
  precio_unitario: number;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notas?: string;
}

export class CreatePedidoDto {
  @IsNotEmpty({ message: 'El id_negocio es requerido' })
  @IsNumber({}, { message: 'El id_negocio debe ser un número' })
  id_negocio: number;

  @IsOptional()
  @IsNumber({}, { message: 'El id_usuario debe ser un número' })
  id_usuario?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El id_tipo_pago debe ser un número' })
  id_tipo_pago?: number;

  @IsOptional()
  @IsString({ message: 'El nombre_cliente debe ser texto' })
  nombre_cliente?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email_cliente debe ser un email válido' })
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

  @IsNotEmpty({ message: 'Los items son requeridos' })
  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe haber al menos un item en el pedido' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetallePedidoDto)
  items: CreateDetallePedidoDto[];
}
