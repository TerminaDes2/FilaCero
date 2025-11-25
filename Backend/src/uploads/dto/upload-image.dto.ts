import { IsNotEmpty } from 'class-validator';

export class UploadImageDto {
  @IsNotEmpty()
  readonly description: string; // Puedes agregar más campos según sea necesario
}