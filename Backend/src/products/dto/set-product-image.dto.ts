import { IsUrl, MaxLength } from 'class-validator';

export class SetProductImageDto {
    @IsUrl({}, { message: 'La URL de la imagen debe ser válida' })
    @MaxLength(2048)
    imageUrl!: string;
}
