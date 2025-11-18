import * as nodemailer from 'nodemailer';
import { SmtpConfig } from 'src/common/dto';

export const createTransporter = (smtpConfig: SmtpConfig) => {
    // Añadimos timeouts y flags de debug/logger para ayudar a diagnosticar problemas de conexión
    return nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure ?? false,
        auth: smtpConfig.auth ? {
            user: smtpConfig.auth.user,
            pass: smtpConfig.auth.pass,
        } : undefined,
        // Mejorar logging de nodemailer para ver handshake/errores
        logger: true,
        debug: true,
        // Timeouts (ms) — valores razonables para evitar bloqueos indefinidos
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 20000,
    });
}