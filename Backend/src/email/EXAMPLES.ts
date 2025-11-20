// ============================================
// EJEMPLOS DE USO - Envío de Emails con Zoho OAuth HTTP
// ============================================

import { EmailService } from './email.service';
import { Injectable } from '@nestjs/common';

/**
 * Ejemplo 1: Enviar email de bienvenida
 */
@Injectable()
export class UsuariosService {
    constructor(private readonly emailService: EmailService) {}

    async crearUsuario(email: string, nombre: string) {
        // ... lógica de creación del usuario

        // Enviar email de bienvenida
        await this.emailService.sendEmail({
            mailOptions: {
                from: 'no-reply@filacero.store',
                to: email,
                subject: '¡Bienvenido a FilaCero!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #333;">¡Hola ${nombre}!</h1>
                        <p>Bienvenido a FilaCero. Tu cuenta ha sido creada exitosamente.</p>
                        <p>Ahora puedes:</p>
                        <ul>
                            <li>Explorar productos</li>
                            <li>Gestionar tu negocio</li>
                            <li>Ver métricas en tiempo real</li>
                        </ul>
                        <a href="https://filacero.store/login" 
                           style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
                            Iniciar Sesión
                        </a>
                    </div>
                `,
                text: `¡Hola ${nombre}! Bienvenido a FilaCero. Tu cuenta ha sido creada exitosamente.`,
            },
            smtpConfig: {
                host: 'smtp.zoho.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'no-reply@filacero.store',
                    pass: 'password', // No se usa si MAIL_USE_HTTP=true
                },
            },
        });
    }
}

/**
 * Ejemplo 2: Enviar email de verificación con código
 */
@Injectable()
export class AuthService {
    constructor(private readonly emailService: EmailService) {}

    async enviarCodigoVerificacion(email: string, codigo: string) {
        await this.emailService.sendEmail({
            mailOptions: {
                from: 'no-reply@filacero.store',
                to: email,
                subject: 'Código de Verificación - FilaCero',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #333;">Verifica tu cuenta</h2>
                        <p>Tu código de verificación es:</p>
                        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff;">
                                ${codigo}
                            </span>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            Este código expira en 10 minutos.
                        </p>
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            Si no solicitaste este código, ignora este email.
                        </p>
                    </div>
                `,
                text: `Tu código de verificación es: ${codigo}. Expira en 10 minutos.`,
            },
            smtpConfig: {
                host: 'smtp.zoho.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'no-reply@filacero.store',
                    pass: 'password',
                },
            },
        });
    }
}

/**
 * Ejemplo 3: Enviar notificación de pedido
 */

interface PedidoItem {
    nombre: string;
    cantidad: number;
    precio: number;
}

@Injectable()
export class PedidosService {
    constructor(private readonly emailService: EmailService) {}

    async notificarNuevoPedido(pedidoId: string, clienteEmail: string, items: PedidoItem[]) {
        const totalPrecio = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

        await this.emailService.sendEmail({
            mailOptions: {
                from: 'no-reply@filacero.store',
                to: clienteEmail,
                subject: `Pedido #${pedidoId} Confirmado`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #28a745;">✓ Pedido Confirmado</h1>
                        <p>Tu pedido <strong>#${pedidoId}</strong> ha sido confirmado.</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Resumen del Pedido</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                ${items.map(item => `
                                    <tr>
                                        <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">
                                            ${item.nombre}
                                        </td>
                                        <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: right;">
                                            ${item.cantidad} x $${item.precio}
                                        </td>
                                    </tr>
                                `).join('')}
                                <tr>
                                    <td style="padding: 8px; font-weight: bold;">Total</td>
                                    <td style="padding: 8px; text-align: right; font-weight: bold;">
                                        $${totalPrecio.toFixed(2)}
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <p>Te notificaremos cuando tu pedido esté listo.</p>
                    </div>
                `,
                text: `Tu pedido #${pedidoId} ha sido confirmado. Total: $${totalPrecio.toFixed(2)}`,
            },
            smtpConfig: {
                host: 'smtp.zoho.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'no-reply@filacero.store',
                    pass: 'password',
                },
            },
        });
    }
}

/**
 * Ejemplo 4: Enviar email con múltiples casillas (from diferente)
 */
@Injectable()
export class ContactoService {
    constructor(private readonly emailService: EmailService) {}

    async enviarContacto(nombre: string, email: string, mensaje: string) {
        // Email al usuario confirmando recepción
        await this.emailService.sendEmail({
            mailOptions: {
                from: 'contacto@filacero.store', // Casilla de contacto
                to: email,
                subject: 'Hemos recibido tu mensaje',
                html: `
                    <div style="font-family: Arial, sans-serif;">
                        <h2>Gracias por contactarnos, ${nombre}</h2>
                        <p>Hemos recibido tu mensaje y te responderemos a la brevedad.</p>
                        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                            <strong>Tu mensaje:</strong><br>
                            ${mensaje}
                        </div>
                    </div>
                `,
                text: `Gracias por contactarnos, ${nombre}. Hemos recibido tu mensaje.`,
            },
            smtpConfig: {
                host: 'smtp.zoho.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'contacto@filacero.store',
                    pass: 'password',
                },
            },
        });
    }
}

/**
 * Ejemplo 5: Enviar notificación a múltiples destinatarios (ループ)
 */
@Injectable()
export class NotificacionesService {
    constructor(private readonly emailService: EmailService) {}

    async notificarAdministradores(asunto: string, contenido: string) {
        const admins = ['admin1@filacero.store', 'admin2@filacero.store'];

        // Enviar a cada administrador
        const promesas = admins.map(adminEmail =>
            this.emailService.sendEmail({
                mailOptions: {
                    from: 'no-reply@filacero.store',
                    to: adminEmail,
                    subject: asunto,
                    html: `
                        <div style="font-family: Arial, sans-serif;">
                            <h2>Notificación Administrativa</h2>
                            ${contenido}
                        </div>
                    `,
                    text: contenido,
                },
                smtpConfig: {
                    host: 'smtp.zoho.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'no-reply@filacero.store',
                        pass: 'password',
                    },
                },
            })
        );

        await Promise.all(promesas);
    }
}

/**
 * Ejemplo 6: Manejo de errores al enviar emails
 */
@Injectable()
export class EmailSeguroService {
    constructor(private readonly emailService: EmailService) {}

    async enviarConManejodeErrores(email: string) {
        try {
            const resultado = await this.emailService.sendEmail({
                mailOptions: {
                    from: 'no-reply@filacero.store',
                    to: email,
                    subject: 'Test',
                    html: '<p>Test email</p>',
                },
                smtpConfig: {
                    host: 'smtp.zoho.com',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'no-reply@filacero.store',
                        pass: 'password',
                    },
                },
            });

            console.log('Email encolado:', resultado.jobId);
            return { success: true, jobId: resultado.jobId };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('Error al enviar email:', msg);
            // Opción: guardar en BD para reintento manual
            // Opción: enviar notificación a soporte
            return { success: false, error: msg };
        }
    }
}

// ============================================
// TESTING CON cURL
// ============================================

/**
 * Test 1: Verificar estado de autorización
 * 
 * curl http://localhost:3000/api/email/auth/status
 */

/**
 * Test 2: Iniciar autorización OAuth (en navegador)
 * 
 * Visitar: http://localhost:3000/api/email/auth
 */

/**
 * Test 3: Enviar email de prueba
 * 
 * curl -X POST http://localhost:3000/api/email/send \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "mailOptions": {
 *       "from": "no-reply@filacero.store",
 *       "to": "test@ejemplo.com",
 *       "subject": "Email de Prueba",
 *       "html": "<h1>Hola</h1><p>Este es un email de prueba.</p>",
 *       "text": "Hola, este es un email de prueba."
 *     },
 *     "smtpConfig": {
 *       "host": "smtp.zoho.com",
 *       "port": 587,
 *       "secure": false,
 *       "auth": {
 *         "user": "no-reply@filacero.store",
 *         "pass": "password"
 *       }
 *     }
 *   }'
 */

// ============================================
// CONFIGURACIÓN RECOMENDADA
// ============================================

/**
 * .env para desarrollo local (SMTP)
 * 
 * MAIL_USE_HTTP=false
 * 
 * MAIL_NOREPLY_USER=no-reply@filacero.store
 * MAIL_NOREPLY_PASS=tu_password_smtp
 */

/**
 * .env para producción (Zoho HTTP OAuth)
 * 
 * MAIL_USE_HTTP=true
 * 
 * ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXX
 * ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * ZOHO_REDIRECT_URI=https://api.filacero.store/api/email/auth/callback
 */
