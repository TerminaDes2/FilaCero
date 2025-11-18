import * as nodemailer from 'nodemailer';
import { SmtpConfig } from 'src/common/dto';

export const createTransporter = (smtpConfig: SmtpConfig) => {
    return nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure || false,
        auth: smtpConfig.auth ? {
            user: smtpConfig.auth.user,
            pass: smtpConfig.auth.pass,
        } : undefined
    });
}