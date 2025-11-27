export class GlobalProductActionDto {
  action!: 'add' | 'deactivate' | 'update_price';
  id_producto!: string | number;
  precio?: number;
  initial_stock?: number;
  motivo?: string;
}
