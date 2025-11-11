import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, Length, Matches, MaxLength } from 'class-validator';

export class VerifyEmailDto {
    @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
    @MaxLength(254, { message: 'El correo electrónico es demasiado largo' })
    @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    correo_electronico!: string;

    @IsNotEmpty({ message: 'El código de verificación es obligatorio' })
    @Length(6, 6, { message: 'El código debe contener 6 dígitos' })
    @Matches(/^\d{6}$/, { message: 'El código debe contener únicamente números' })
    codigo!: string;
}
