import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { v4 as uuidv4 } from 'uuid';

interface EventEnvelope {
  eventId: string;
  type: 'order.created' | 'order.status.changed' | 'room.closing';
  timestamp: number;
  payload: any;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Convierte BigInt a número para evitar errores de serialización JSON
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeBigInt(obj[key]);
      }
    }
    return serialized;
  }

  return obj;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private emailRetryQueue: Map<string, { attempts: number; lastAttempt: Date | null }> = new Map();
  private readonly MAX_EMAIL_RETRIES = 3;
  private gateway: any; // Se inyecta después para evitar dependencia circular

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Establece el gateway (llamado desde el gateway después de la construcción)
   */
  setGateway(gateway: any): void {
    this.gateway = gateway;
  }

  /**
   * Crea un evento con formato envelope estandarizado
   */
  createEventEnvelope(
    type: 'order.created' | 'order.status.changed' | 'room.closing',
    payload: any,
  ): EventEnvelope {
    return {
      eventId: uuidv4(),
      type,
      timestamp: Date.now(),
      payload,
    };
  }

  /**
   * Notifica nuevo pedido al POS
   */
  async notifyNewOrder(pedido: any): Promise<void> {
    try {
      // Serializar BigInt antes de usar
      const serializedPedido = serializeBigInt(pedido);
      
      // Crear evento con formato envelope
      const event = this.createEventEnvelope('order.created', serializedPedido);

      // Emitir evento WebSocket al POS del negocio
      if (this.gateway) {
        this.gateway.emitNewOrder(serializedPedido.id_negocio, event);
      }

      // Crear notificación en BD para el negocio
      await this.prisma.notificacion.create({
        data: {
          id_negocio: serializedPedido.id_negocio,
          id_pedido: serializedPedido.id_pedido,
          tipo: 'nuevo_pedido',
          titulo: `Nuevo pedido #${serializedPedido.id_pedido}`,
          mensaje: `Se ha recibido un nuevo pedido con ${serializedPedido.detalle_pedido?.length || 0} productos`,
          canal: 'websocket',
          enviada_en: new Date(),
        },
      });

      // Enviar email de confirmación al cliente
      if (serializedPedido.email_cliente || serializedPedido.usuario?.correo_electronico) {
        const userEmail = serializedPedido.email_cliente || serializedPedido.usuario.correo_electronico;
        const userName = serializedPedido.nombre_cliente || serializedPedido.usuario?.nombre || 'Cliente';
        
        await this.sendOrderEmail(
          userEmail,
          userName,
          serializedPedido,
          'received',
          'es', // TODO: Detectar idioma del usuario
        );
      }

      this.logger.log(`Notification sent for new order ${serializedPedido.id_pedido} to business ${serializedPedido.id_negocio}`);
    } catch (error) {
      this.logger.error(`Error notifying new order ${pedido.id_pedido}:`, error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Notifica cambio de estado del pedido al cliente
   */
  async notifyOrderStatusChange(pedido: any, nuevoEstado: string): Promise<void> {
    try {
      // Serializar BigInt antes de usar
      const serializedPedido = serializeBigInt(pedido);
      
      // Crear evento con formato envelope
      const event = this.createEventEnvelope('order.status.changed', {
        ...serializedPedido,
        estado: nuevoEstado,
      });

      // Emitir evento WebSocket al cliente
      if (this.gateway) {
        this.gateway.emitOrderStatusChange(serializedPedido.id_pedido, event);
      }

      // Crear notificación en BD para el usuario
      if (serializedPedido.id_usuario) {
        await this.prisma.notificacion.create({
          data: {
            id_usuario: serializedPedido.id_usuario,
            id_pedido: serializedPedido.id_pedido,
            tipo: 'estado_pedido',
            titulo: `Pedido #${serializedPedido.id_pedido} - ${this.getEstadoSpanish(nuevoEstado)}`,
            mensaje: `Tu pedido ha cambiado a estado: ${this.getEstadoSpanish(nuevoEstado)}`,
            canal: 'websocket',
            enviada_en: new Date(),
          },
        });
      }

      // Enviar email según el estado
      const emailType = this.getEmailTypeForStatus(nuevoEstado);
      if (emailType && (serializedPedido.email_cliente || serializedPedido.usuario?.correo_electronico)) {
        const userEmail = serializedPedido.email_cliente || serializedPedido.usuario.correo_electronico;
        const userName = serializedPedido.nombre_cliente || serializedPedido.usuario?.nombre || 'Cliente';
        
        await this.sendOrderEmail(
          userEmail,
          userName,
          serializedPedido,
          emailType,
          'es', // TODO: Detectar idioma del usuario
        );
      }

      this.logger.log(
        `Notification sent for order ${serializedPedido.id_pedido} status change to ${nuevoEstado}`,
      );
    } catch (error) {
      this.logger.error(`Error notifying status change for order ${pedido.id_pedido}:`, error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  /**
   * Envía email con circuit breaker y configuración SMTP
   */
  private async sendOrderEmail(
    to: string,
    userName: string,
    pedido: any,
    type: 'received' | 'preparing' | 'ready',
    lang: 'es' | 'en',
  ): Promise<void> {
    const retry = this.emailRetryQueue.get(`${pedido.id_pedido}-${type}`) || {
      attempts: 0,
      lastAttempt: null,
    };

    if (retry.attempts >= this.MAX_EMAIL_RETRIES) {
      this.logger.warn(
        `Max retries reached for order ${pedido.id_pedido} email (${type}), giving up`,
      );
      return;
    }

    try {
      const template = this.getEmailTemplate(type, lang, userName, pedido);
      
      // Construir configuración SMTP desde variables de entorno
      // Puerto 587 usa STARTTLS (secure: false), Puerto 465 usa SSL (secure: true)
      const smtpConfig = {
        host: process.env.MAIL_HOST || 'smtp.zoho.com',
        port: parseInt(process.env.MAIL_PORT || '587', 10),
        secure: process.env.MAIL_SECURE === 'true', // false para puerto 587 (STARTTLS)
        auth: {
          user: process.env.MAIL_NOREPLY_USER || '',
          pass: process.env.MAIL_NOREPLY_PASS || '',
        },
      };

      await this.emailService.sendEmail({
        smtpConfig,
        mailOptions: {
          from: process.env.MAIL_NOREPLY_FROM || 'noreply@filacero.com',
          to,
          subject: template.subject,
          html: template.html,
        },
      });

      this.logger.log(`Email sent to ${to} for order ${pedido.id_pedido} (${type})`);

      // Limpiar de la cola de reintentos si fue exitoso
      this.emailRetryQueue.delete(`${pedido.id_pedido}-${type}`);
    } catch (error) {
      retry.attempts++;
      retry.lastAttempt = new Date();
      this.emailRetryQueue.set(`${pedido.id_pedido}-${type}`, retry);

      this.logger.error(
        `Error sending email for order ${pedido.id_pedido} (attempt ${retry.attempts}/${this.MAX_EMAIL_RETRIES}):`,
        error,
      );

      // Reintentar con backoff exponencial
      if (retry.attempts < this.MAX_EMAIL_RETRIES) {
        const delay = Math.pow(2, retry.attempts) * 1000; // 2s, 4s, 8s
        this.logger.log(
          `Retrying email for order ${pedido.id_pedido} in ${delay}ms`,
        );

        setTimeout(() => {
          this.sendOrderEmail(to, userName, pedido, type, lang).catch((err) => {
            this.logger.error(`Retry failed for order ${pedido.id_pedido}:`, err);
          });
        }, delay);
      }
    }
  }

  /**
   * Obtiene el template de email según el tipo y lenguaje
   */
  private getEmailTemplate(
    type: 'received' | 'preparing' | 'ready',
    language: 'es' | 'en',
    userName: string,
    pedido: any,
  ): EmailTemplate {
    // Construir lista de productos
    const productos = pedido.detalle_pedido || [];
    const productosHtml = this.buildProductsHtml(productos, type, language);

    const templates = {
      es: {
        received: {
          subject: `Pedido #${pedido.id_pedido} Recibido - FilaCero`,
          html: this.buildEmailHtml({
            userName,
            title: '¡Gracias por tu pedido!',
            subtitle: `Pedido #${pedido.id_pedido}`,
            mainMessage: 'Hemos recibido tu pedido y estamos comenzando a prepararlo.',
            productsHtml: productosHtml,
            footerInfo: `
              <div style="margin-top: 24px; padding: 16px; background: #f6e4b8; border-radius: 12px; border: 1px solid #e2cfa4;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="color: #5a2d2f; font-weight: 600; font-size: 16px;">Total</span>
                  <span style="color: #e94a6f; font-weight: 700; font-size: 20px;">$${Number(pedido.total).toFixed(2)}</span>
                </div>
                <div style="color: #775f54; font-size: 14px;">
                  <strong>Tiempo estimado:</strong> ${pedido.tiempo_entrega || '15-20 minutos'}
                </div>
              </div>
            `,
            ctaText: 'Ver pedido',
            ctaLink: `${process.env.FRONTEND_URL || 'https://filacero.com'}/user/orders/${pedido.id_pedido}`,
          }),
        },
        preparing: {
          subject: `Pedido #${pedido.id_pedido} en Preparación - FilaCero`,
          html: this.buildEmailHtml({
            userName,
            title: '¡Tu pedido está en camino!',
            subtitle: `Pedido #${pedido.id_pedido}`,
            mainMessage: 'Estamos preparando tu pedido con cuidado.',
            productsHtml: productosHtml,
            footerInfo: `
              <div style="margin-top: 24px; padding: 16px; background: #effaf8; border-radius: 12px; border: 1px solid #b3e7df;">
                <p style="color: #2f8d7d; font-size: 14px; margin: 0;">
                  <strong>Estado:</strong> En preparación<br/>
                  Estará listo pronto
                </p>
              </div>
            `,
            ctaText: 'Ver estado del pedido',
            ctaLink: `${process.env.FRONTEND_URL || 'https://filacero.com'}/user/orders/${pedido.id_pedido}`,
          }),
        },
        ready: {
          subject: `Pedido #${pedido.id_pedido} Listo - FilaCero`,
          html: this.buildEmailHtml({
            userName,
            title: '¡Tu pedido está listo!',
            subtitle: `Pedido #${pedido.id_pedido}`,
            mainMessage: 'Tu pedido está listo para recoger.',
            productsHtml: productosHtml,
            footerInfo: `
              <div style="margin-top: 24px; padding: 16px; background: #d8f3ee; border-radius: 12px; border: 1px solid #89d9ce;">
                <p style="color: #2f8d7d; font-size: 14px; margin: 0;">
                  <strong>📍 Ubicación:</strong> ${pedido.negocio?.direccion || 'Ver en la app'}<br/>
                  <strong>🕒 Estado:</strong> Listo para recoger
                </p>
              </div>
            `,
            ctaText: 'Ver detalles',
            ctaLink: `${process.env.FRONTEND_URL || 'https://filacero.com'}/user/orders/${pedido.id_pedido}`,
          }),
        },
      },
      en: {
        received: {
          subject: `Order #${pedido.id_pedido} Received - FilaCero`,
          html: this.buildEmailHtml({
            userName,
            title: 'Thank you for your order!',
            subtitle: `Order #${pedido.id_pedido}`,
            mainMessage: 'We have received your order and are starting to prepare it.',
            productsHtml: productosHtml,
            footerInfo: `
              <div style="margin-top: 24px; padding: 16px; background: #f6e4b8; border-radius: 12px; border: 1px solid #e2cfa4;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <span style="color: #5a2d2f; font-weight: 600; font-size: 16px;">Total</span>
                  <span style="color: #e94a6f; font-weight: 700; font-size: 20px;">$${Number(pedido.total).toFixed(2)}</span>
                </div>
                <div style="color: #775f54; font-size: 14px;">
                  <strong>Estimated time:</strong> ${pedido.tiempo_entrega || '15-20 minutes'}
                </div>
              </div>
            `,
            ctaText: 'View order',
            ctaLink: `${process.env.FRONTEND_URL || 'https://filacero.com'}/user/orders/${pedido.id_pedido}`,
          }),
        },
        preparing: {
          subject: `Order #${pedido.id_pedido} Being Prepared - FilaCero`,
          html: this.buildEmailHtml({
            userName,
            title: 'Your order is on its way!',
            subtitle: `Order #${pedido.id_pedido}`,
            mainMessage: 'We are carefully preparing your order.',
            productsHtml: productosHtml,
            footerInfo: `
              <div style="margin-top: 24px; padding: 16px; background: #effaf8; border-radius: 12px; border: 1px solid #b3e7df;">
                <p style="color: #2f8d7d; font-size: 14px; margin: 0;">
                  <strong>Status:</strong> Being prepared<br/>
                  It will be ready soon
                </p>
              </div>
            `,
            ctaText: 'View order status',
            ctaLink: `${process.env.FRONTEND_URL || 'https://filacero.com'}/user/orders/${pedido.id_pedido}`,
          }),
        },
        ready: {
          subject: `Order #${pedido.id_pedido} Ready - FilaCero`,
          html: this.buildEmailHtml({
            userName,
            title: 'Your order is ready!',
            subtitle: `Order #${pedido.id_pedido}`,
            mainMessage: 'Your order is ready for pickup.',
            productsHtml: productosHtml,
            footerInfo: `
              <div style="margin-top: 24px; padding: 16px; background: #d8f3ee; border-radius: 12px; border: 1px solid #89d9ce;">
                <p style="color: #2f8d7d; font-size: 14px; margin: 0;">
                  <strong>📍 Location:</strong> ${pedido.negocio?.direccion || 'See in app'}<br/>
                  <strong>🕒 Status:</strong> Ready for pickup
                </p>
              </div>
            `,
            ctaText: 'View details',
            ctaLink: `${process.env.FRONTEND_URL || 'https://filacero.com'}/user/orders/${pedido.id_pedido}`,
          }),
        },
      },
    };

    return templates[language][type];
  }

  /**
   * Construye el HTML de la lista de productos
   */
  private buildProductsHtml(
    productos: any[],
    type: 'received' | 'preparing' | 'ready',
    language: 'es' | 'en',
  ): string {
    if (!productos || productos.length === 0) {
      return '';
    }

    const showPrice = type === 'received'; // Solo mostrar precio en el email de confirmación
    const productLabel = language === 'es' ? 'Producto' : 'Product';
    const quantityLabel = language === 'es' ? 'Cantidad' : 'Quantity';
    const priceLabel = language === 'es' ? 'Precio' : 'Price';

    let html = `
      <div style="margin: 24px 0;">
        <h3 style="color: #5a2d2f; font-size: 16px; font-weight: 600; margin-bottom: 12px;">
          ${language === 'es' ? 'Productos:' : 'Products:'}
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
    `;

    productos.forEach((item, index) => {
      const productName = item.producto?.nombre || item.nombre_producto || 'Producto';
      const cantidad = item.cantidad || 1;
      const precioUnitario = item.precio_unitario || 0;
      const subtotal = cantidad * precioUnitario;

      const bgColor = index % 2 === 0 ? '#fffcf0' : '#ffffff';

      html += `
        <tr style="background: ${bgColor};">
          <td style="padding: 12px; border: 1px solid #ead9b6; color: #5a2d2f; font-size: 14px;">
            <strong>${productName}</strong>
          </td>
          <td style="padding: 12px; border: 1px solid #ead9b6; color: #775f54; font-size: 14px; text-align: center; width: 80px;">
            ${cantidad}
          </td>
      `;

      if (showPrice) {
        html += `
          <td style="padding: 12px; border: 1px solid #ead9b6; color: #e94a6f; font-size: 14px; font-weight: 600; text-align: right; width: 100px;">
            $${subtotal.toFixed(2)}
          </td>
        `;
      }

      html += `</tr>`;
    });

    html += `
        </table>
      </div>
    `;

    return html;
  }

  /**
   * Construye el HTML completo del email con diseño profesional
   */
  private buildEmailHtml(params: {
    userName: string;
    title: string;
    subtitle: string;
    mainMessage: string;
    productsHtml: string;
    footerInfo: string;
    ctaText: string;
    ctaLink: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${params.title}</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f6f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f6f6f6;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              
              <!-- Container principal -->
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                
                <!-- Header con gradiente -->
                <tr>
                  <td style="background: linear-gradient(135deg, #e94a6f 0%, #de355f 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.02em;">
                      FilaCero
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Tu pedido en tiempo real
                    </p>
                  </td>
                </tr>

                <!-- Contenido principal -->
                <tr>
                  <td style="padding: 32px 24px;">
                    
                    <!-- Saludo -->
                    <h2 style="margin: 0 0 8px 0; color: #111827; font-size: 24px; font-weight: 600;">
                      ¡Hola ${params.userName}!
                    </h2>
                    
                    <!-- Título principal -->
                    <div style="margin: 16px 0; padding: 16px; background: linear-gradient(135deg, #fff5f7 0%, #ffe8ed 100%); border-radius: 12px; border-left: 4px solid #e94a6f;">
                      <h3 style="margin: 0 0 4px 0; color: #e94a6f; font-size: 18px; font-weight: 600;">
                        ${params.title}
                      </h3>
                      <p style="margin: 0; color: #5a2d2f; font-size: 16px; font-weight: 500;">
                        ${params.subtitle}
                      </p>
                    </div>

                    <!-- Mensaje principal -->
                    <p style="margin: 20px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                      ${params.mainMessage}
                    </p>

                    <!-- Lista de productos -->
                    ${params.productsHtml}

                    <!-- Información adicional (Total, tiempo, ubicación) -->
                    ${params.footerInfo}

                    <!-- Botón CTA -->
                    <div style="text-align: center; margin-top: 32px;">
                      <a href="${params.ctaLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #e94a6f 0%, #de355f 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(233, 74, 111, 0.3); transition: all 0.3s ease;">
                        ${params.ctaText}
                      </a>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
                      Gracias por elegir FilaCero
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} FilaCero. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Mapea estado del pedido a tipo de email
   */
  private getEmailTypeForStatus(estado: string): 'received' | 'preparing' | 'ready' | null {
    switch (estado) {
      case 'confirmado':
        return 'received';
      case 'en_preparacion':
        return 'preparing';
      case 'listo':
        return 'ready';
      default:
        return null;
    }
  }

  /**
   * Traduce estado a español
   */
  private getEstadoSpanish(estado: string): string {
    const translations: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_preparacion: 'En Preparación',
      listo: 'Listo',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return translations[estado] || estado;
  }
}
