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
    // TODO: Cargar templates desde archivos HTML
    const templates = {
      es: {
        received: {
          subject: `Pedido #${pedido.id_pedido} Recibido - FilaCero`,
          html: `
            <h1>¡Hola ${userName}!</h1>
            <p>Hemos recibido tu pedido #${pedido.id_pedido}</p>
            <p>Total: $${pedido.total}</p>
            <p>Tiempo estimado: ${pedido.tiempo_entrega || '15-20 minutos'}</p>
            <p>Gracias por tu compra.</p>
          `,
        },
        preparing: {
          subject: `Pedido #${pedido.id_pedido} en Preparación - FilaCero`,
          html: `
            <h1>¡Hola ${userName}!</h1>
            <p>Tu pedido #${pedido.id_pedido} está siendo preparado</p>
            <p>Estará listo pronto.</p>
          `,
        },
        ready: {
          subject: `Pedido #${pedido.id_pedido} Listo - FilaCero`,
          html: `
            <h1>¡Hola ${userName}!</h1>
            <p>Tu pedido #${pedido.id_pedido} está listo para recoger</p>
            <p>Ubicación: ${pedido.negocio?.direccion || 'Ver en la app'}</p>
          `,
        },
      },
      en: {
        received: {
          subject: `Order #${pedido.id_pedido} Received - FilaCero`,
          html: `
            <h1>Hello ${userName}!</h1>
            <p>We have received your order #${pedido.id_pedido}</p>
            <p>Total: $${pedido.total}</p>
            <p>Estimated time: ${pedido.tiempo_entrega || '15-20 minutes'}</p>
            <p>Thank you for your purchase.</p>
          `,
        },
        preparing: {
          subject: `Order #${pedido.id_pedido} Being Prepared - FilaCero`,
          html: `
            <h1>Hello ${userName}!</h1>
            <p>Your order #${pedido.id_pedido} is being prepared</p>
            <p>It will be ready soon.</p>
          `,
        },
        ready: {
          subject: `Order #${pedido.id_pedido} Ready - FilaCero`,
          html: `
            <h1>Hello ${userName}!</h1>
            <p>Your order #${pedido.id_pedido} is ready for pickup</p>
            <p>Location: ${pedido.negocio?.direccion || 'See in app'}</p>
          `,
        },
      },
    };

    return templates[language][type];
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
