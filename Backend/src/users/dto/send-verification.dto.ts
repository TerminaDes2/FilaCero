import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendVerificationDto {
    @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
    @MaxLength(254, { message: 'El correo electrónico es demasiado largo' })
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    correo_electronico!: string;
}
