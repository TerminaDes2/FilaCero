import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class MailOptions {
    @IsString()
    @IsNotEmpty()
    from: string;

    @IsEmail()
    @IsNotEmpty()
    to: string;

    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsNotEmpty()
    html?: string;

    @IsString()
    @IsOptional()
    text?: string;
}

export class SmtpAuth {
    @IsString()
    @IsNotEmpty()
    user: string;

    @IsString()
    @IsNotEmpty()
    pass: string;
}

export class SmtpConfig {
    @IsString()
    @IsNotEmpty()
    host: string;

    @IsNotEmpty()
    @IsNumber()
    port: number;

    @IsOptional()
    @IsBoolean()
    secure?: boolean;

    @IsObject()
    @IsNotEmpty()
    auth?: SmtpAuth;
}

export class SendEmailDto {
    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => MailOptions)
    mailOptions: MailOptions;

    @IsObject()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => SmtpConfig)
    smtpConfig: SmtpConfig;
}