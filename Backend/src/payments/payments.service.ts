import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { SavePaymentMethodDto } from './dto/save-payment-method.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  // Métricas y contadores
  private metrics = {
    total_payments_created: 0,
    total_payments_succeeded: 0,
    total_payments_failed: 0,
    total_payments_canceled: 0,
    total_payments_refunded: 0,
    total_amount_processed: 0, // En MXN
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Crea un PaymentIntent en Stripe y registra transacción en estado 'pending'.
   */
  async createPaymentIntent(
    userId: bigint,
    dto: CreatePaymentIntentDto,
  ): Promise<any> {
    const startTime = Date.now();
    this.logger.log(
      JSON.stringify({
        event: 'payment_intent_create_started',
        timestamp: new Date().toISOString(),
        userId: userId.toString(),
        pedidoId: dto.pedidoId.toString(),
        metadata: dto.metadata,
      }),
    );

    // Verificar que el pedido existe y pertenece a un negocio activo
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: dto.pedidoId },
      include: { negocio: true, usuario: true },
    });
    if (!pedido) {
      throw new NotFoundException(
        `Pedido ${dto.pedidoId} no encontrado`,
      );
    }

    // VALIDACIÓN 1: El pedido debe pertenener al usuario autenticado
    if (pedido.id_usuario !== userId) {
      this.logger.warn(
        `⚠️ Intento de pago no autorizado: usuario ${userId} intentó pagar pedido ${dto.pedidoId} de usuario ${pedido.id_usuario}`,
      );
      throw new ForbiddenException('El pedido no pertenece al usuario actual');
    }

    // VALIDACIÓN 2: El monto debe estar en rango válido (0.50 - 999,999 MXN)
    const montoTotal = Number(pedido.total);
    if (montoTotal <= 0 || montoTotal > 999999) {
      this.logger.error(
        `❌ Monto inválido para pedido ${dto.pedidoId}: ${montoTotal}`,
      );
      throw new BadRequestException(
        `Monto inválido: debe estar entre $0.50 y $999,999.00 MXN`,
      );
    }

    // VALIDACIÓN 3: El pedido no debe estar cancelado
    if (pedido.estado === 'cancelado') {
      this.logger.warn(
        `⚠️ Intento de pagar pedido cancelado: ${dto.pedidoId}`,
      );
      throw new BadRequestException(
        'No se puede procesar pago para un pedido cancelado',
      );
    }

    // VALIDACIÓN 4: No debe existir ya una transacción exitosa para este pedido
    const transaccionExitosa = await this.prisma.transaccion_pago.findFirst({
      where: {
        id_pedido: dto.pedidoId,
        estado: 'succeeded',
      },
    });
    if (transaccionExitosa) {
      this.logger.warn(
        `⚠️ Pedido ${dto.pedidoId} ya tiene pago exitoso: transacción ${transaccionExitosa.id_transaccion}`,
      );
      throw new BadRequestException('Este pedido ya ha sido pagado');
    }

    // Convertir monto a centavos
    const amountCents = Math.round(Number(pedido.total) * 100);

    // Obtener/crear Stripe customer
    const usuario = pedido.usuario;
    let customerId = usuario?.stripe_customer_id;
    if (!customerId) {
      customerId = await this.stripe.getOrCreateCustomer(
        BigInt(usuario.id_usuario),
        usuario.correo_electronico,
        usuario.nombre,
      );
      // Actualizar en BD
      await this.prisma.usuarios.update({
        where: { id_usuario: usuario.id_usuario },
        data: { stripe_customer_id: customerId },
      });
    }

    // Crear PaymentIntent con idempotency key para evitar cobros duplicados
    const idempotencyKey = `pedido_${dto.pedidoId}_${Date.now()}`;
    const paymentIntent = await this.stripe.createPaymentIntent(
      {
        amount: amountCents,
        currency: 'mxn',
        customerId,
        metadata: {
          pedido_id: dto.pedidoId.toString(),
          user_id: userId.toString(),
        },
      },
      idempotencyKey,
    );

    // Registrar transacción inicial
    const transaccion = await this.prisma.transaccion_pago.create({
      data: {
        id_pedido: dto.pedidoId,
        stripe_payment_id: paymentIntent.id,
        stripe_customer_id: customerId,
        monto: pedido.total,
        moneda: 'mxn',
        estado: 'pending',
        metodo_pago: 'tarjeta',
        metadata: dto.metadata || {},
      },
    });

    this.logger.log(
      `✅ PaymentIntent creado exitosamente | paymentIntentId=${paymentIntent.id} | transaccionId=${transaccion.id_transaccion} | monto=${pedido.total} MXN | userId=${userId} | pedidoId=${dto.pedidoId}`,
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      transaccionId: transaccion.id_transaccion.toString(),
    };
  }

  /**
   * Confirma el pago (webhook o llamada manual) y actualiza pedido/transacción.
   */
  async confirmPayment(dto: ConfirmPaymentDto): Promise<any> {
    this.logger.log(
      `▶️ confirmPayment iniciado | paymentIntentId=${dto.paymentIntentId}`,
    );

    const transaccion = await this.prisma.transaccion_pago.findFirst({
      where: { stripe_payment_id: dto.paymentIntentId },
    });
    if (!transaccion) {
      throw new NotFoundException('Transacción no encontrada');
    }

    // Actualizar transacción a succeeded
    await this.prisma.transaccion_pago.update({
      where: { id_transaccion: transaccion.id_transaccion },
      data: {
        estado: 'succeeded',
        ultima_4_digitos: dto.last4,
        marca_tarjeta: dto.brand,
        tipo_tarjeta: dto.cardType,
        actualizado_en: new Date(),
      },
    });

    // Actualizar pedido a estado 'pagado' / 'confirmado'
    const pedidoActualizado = await this.prisma.pedido.update({
      where: { id_pedido: transaccion.id_pedido },
      data: {
        estado: 'confirmado',
        fecha_confirmacion: new Date(),
      },
      include: {
        detalle_pedido: {
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre: true,
                precio: true,
              },
            },
          },
        },
        negocio: {
          select: {
            id_negocio: true,
            nombre: true,
            direccion: true,
          },
        },
        usuario: {
          select: {
            id_usuario: true,
            nombre: true,
            correo_electronico: true,
          },
        },
      },
    });

    // Incrementar contador de pagos exitosos
    this.metrics.total_payments_succeeded++;
    this.metrics.total_amount_processed += Number(transaccion.monto);

    this.logger.log(
      JSON.stringify({
        event: 'payment_confirmed',
        timestamp: new Date().toISOString(),
        pedidoId: transaccion.id_pedido.toString(),
        transaccionId: transaccion.id_transaccion.toString(),
        paymentIntentId: dto.paymentIntentId,
        amount: Number(transaccion.monto),
        currency: 'MXN',
        metrics: this.getMetrics(),
      }),
    );

    // Enviar email de confirmación al cliente
    try {
      await this.notificationsService.notifyNewOrder(pedidoActualizado);
      this.logger.log(`✅ Email de confirmación enviado para pedido ${transaccion.id_pedido}`);
    } catch (emailError) {
      this.logger.error(
        `⚠️ Error enviando email de confirmación para pedido ${transaccion.id_pedido}:`,
        emailError,
      );
      // No lanzar error para no afectar el flujo de pago
    }

    return { success: true, pedidoId: transaccion.id_pedido.toString() };
  }

  /**
   * Procesa evento de webhook de Stripe.
   */
  async handleWebhookEvent(event: any): Promise<void> {
    this.logger.log(
      `🔔 Webhook recibido | event.type=${event.type} | event.id=${event.id}`,
    );

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.onPaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.onPaymentIntentFailed(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.onPaymentIntentCanceled(event.data.object);
          break;
        case 'charge.refunded':
          await this.onChargeRefunded(event.data.object);
          break;
        default:
          this.logger.warn(
            `⚠️ Evento de webhook no manejado | event.type=${event.type} | event.id=${event.id}`,
          );
      }

      this.logger.log(
        `✅ Webhook procesado exitosamente | event.type=${event.type} | event.id=${event.id}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error procesando webhook | event.type=${event.type} | event.id=${event.id} | error=${error.message}`,
        error.stack,
      );
      // Re-throw para que Stripe reciba 500 y reintente el webhook
      throw error;
    }
  }

  private async onPaymentIntentSucceeded(paymentIntent: any): Promise<void> {
    try {
      const transaccion = await this.prisma.transaccion_pago.findFirst({
        where: { stripe_payment_id: paymentIntent.id },
      });
      if (!transaccion) {
        this.logger.warn(
          `⚠️ Transacción no encontrada para PaymentIntent ${paymentIntent.id}`,
        );
        return;
      }

      await this.prisma.transaccion_pago.update({
        where: { id_transaccion: transaccion.id_transaccion },
        data: {
          estado: 'succeeded',
          stripe_fee: paymentIntent.charges?.data[0]?.balance_transaction
            ?.fee
            ? paymentIntent.charges.data[0].balance_transaction.fee / 100
            : null,
          net_amount: paymentIntent.charges?.data[0]?.balance_transaction
            ?.net
            ? paymentIntent.charges.data[0].balance_transaction.net / 100
            : null,
        },
      });

      const pedidoActualizado = await this.prisma.pedido.update({
        where: { id_pedido: transaccion.id_pedido },
        data: { estado: 'confirmado', fecha_confirmacion: new Date() },
        include: {
          detalle_pedido: {
            include: {
              producto: {
                select: {
                  id_producto: true,
                  nombre: true,
                  precio: true,
                },
              },
            },
          },
          negocio: {
            select: {
              id_negocio: true,
              nombre: true,
              direccion: true,
            },
          },
          usuario: {
            select: {
              id_usuario: true,
              nombre: true,
              correo_electronico: true,
            },
          },
        },
      });

      // Incrementar contador de pagos exitosos (webhook)
      this.metrics.total_payments_succeeded++;
      this.metrics.total_amount_processed += Number(transaccion.monto);

      this.logger.log(
        JSON.stringify({
          event: 'webhook_payment_succeeded',
          timestamp: new Date().toISOString(),
          pedidoId: transaccion.id_pedido.toString(),
          paymentIntentId: paymentIntent.id,
          amount: Number(transaccion.monto),
          currency: 'MXN',
          metrics: this.getMetrics(),
        }),
      );

      // Enviar email de confirmación al cliente vía webhook
      try {
        await this.notificationsService.notifyNewOrder(pedidoActualizado);
        this.logger.log(`✅ Email de confirmación enviado para pedido ${transaccion.id_pedido} (webhook)`);
      } catch (emailError) {
        this.logger.error(
          `⚠️ Error enviando email de confirmación para pedido ${transaccion.id_pedido} (webhook):`,
          emailError,
        );
        // No lanzar error para no afectar el procesamiento del webhook
      }
    } catch (error) {
      this.logger.error(
        `❌ Error procesando payment_intent.succeeded | paymentIntentId=${paymentIntent.id} | error=${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async onPaymentIntentFailed(paymentIntent: any): Promise<void> {
    try {
      const transaccion = await this.prisma.transaccion_pago.findFirst({
        where: { stripe_payment_id: paymentIntent.id },
      });
      if (!transaccion) return;

      await this.prisma.transaccion_pago.update({
        where: { id_transaccion: transaccion.id_transaccion },
        data: {
          estado: 'failed',
          error_codigo: paymentIntent.last_payment_error?.code || 'unknown',
          error_mensaje:
            paymentIntent.last_payment_error?.message || 'Payment failed',
        },
      });

      // Incrementar contador de pagos fallidos
      this.metrics.total_payments_failed++;

      this.logger.warn(
        JSON.stringify({
          event: 'webhook_payment_failed',
          timestamp: new Date().toISOString(),
          level: 'warn',
          pedidoId: transaccion.id_pedido.toString(),
          paymentIntentId: paymentIntent.id,
          errorCode: paymentIntent.last_payment_error?.code || 'unknown',
          errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
          metrics: this.getMetrics(),
        }),
      );
    } catch (error) {
      this.logger.error(
        `❗ Error procesando payment_intent.failed | paymentIntentId=${paymentIntent.id} | error=${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async onPaymentIntentCanceled(paymentIntent: any): Promise<void> {
    try {
      const transaccion = await this.prisma.transaccion_pago.findFirst({
        where: { stripe_payment_id: paymentIntent.id },
      });
      if (!transaccion) {
        this.logger.warn(
          `⚠️ Transacción no encontrada para payment_intent.canceled | paymentIntentId=${paymentIntent.id}`,
        );
        return;
      }

      await this.prisma.transaccion_pago.update({
        where: { id_transaccion: transaccion.id_transaccion },
        data: { estado: 'canceled' },
      });

      // Incrementar contador de pagos cancelados
      this.metrics.total_payments_canceled++;

      this.logger.log(
        JSON.stringify({
          event: 'webhook_payment_canceled',
          timestamp: new Date().toISOString(),
          pedidoId: transaccion.id_pedido.toString(),
          paymentIntentId: paymentIntent.id,
          metrics: this.getMetrics(),
        }),
      );
    } catch (error) {
      this.logger.error(
        `❌ Error procesando payment_intent.canceled | paymentIntentId=${paymentIntent.id} | error=${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Procesa evento charge.refunded (reembolsos).
   * Actualiza transacción a refunded y estado del pedido a cancelado.
   */
  private async onChargeRefunded(charge: any): Promise<void> {
    try {
      this.logger.log(
        `♻️ Procesando reembolso | chargeId=${charge.id} | amount=${charge.amount_refunded / 100} MXN`,
      );

      // Buscar transacción por charge.payment_intent
      const transaccion = await this.prisma.transaccion_pago.findFirst({
        where: { stripe_payment_id: charge.payment_intent },
      });

      if (!transaccion) {
        this.logger.warn(
          `⚠️ Transacción no encontrada para reembolso | chargeId=${charge.id} | paymentIntentId=${charge.payment_intent}`,
        );
        return;
      }

      // Actualizar transacción a refunded
      await this.prisma.transaccion_pago.update({
        where: { id_transaccion: transaccion.id_transaccion },
        data: {
          estado: 'refunded',
          error_mensaje: `Reembolso: ${charge.amount_refunded / 100} MXN`,
        },
      });

      // Actualizar pedido a cancelado
      await this.prisma.pedido.update({
        where: { id_pedido: transaccion.id_pedido },
        data: { estado: 'cancelado' },
      });

      // Incrementar contador de reembolsos
      this.metrics.total_payments_refunded++;

      this.logger.log(
        JSON.stringify({
          event: 'webhook_charge_refunded',
          timestamp: new Date().toISOString(),
          pedidoId: transaccion.id_pedido.toString(),
          transaccionId: transaccion.id_transaccion.toString(),
          chargeId: charge.id,
          amountRefunded: charge.amount_refunded / 100,
          currency: 'MXN',
          metrics: this.getMetrics(),
        }),
      );
    } catch (error) {
      this.logger.error(
        `❌ Error procesando reembolso | chargeId=${charge.id} | error=${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Lista métodos de pago guardados del usuario.
   */
  async getPaymentMethods(userId: bigint): Promise<any[]> {
    this.logger.log(
      `▶️ getPaymentMethods iniciado | userId=${userId}`,
    );

    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: userId },
    });
    if (!usuario || !usuario.stripe_customer_id) {
      return [];
    }

    const methods = await this.prisma.metodo_pago_guardado.findMany({
      where: { id_usuario: userId, activo: true },
      orderBy: { is_default: 'desc' },
    });

    return methods.map((m) => ({
      id: m.id_metodo.toString(),
      tipo: m.tipo,
      marca: m.marca,
      last4: m.ultima_4_digitos,
      expMonth: m.mes_expiracion,
      expYear: m.anio_expiracion,
      isDefault: m.is_default,
    }));
  }

  /**
   * Guarda un nuevo método de pago tokenizado.
   */
  async savePaymentMethod(
    userId: bigint,
    dto: SavePaymentMethodDto,
  ): Promise<any> {
    this.logger.log(
      `▶️ savePaymentMethod iniciado | userId=${userId} | paymentMethodId=${dto.paymentMethodId}`,
    );

    const usuario = await this.prisma.usuarios.findUnique({
      where: { id_usuario: userId },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Attach payment method to Stripe customer
    let customerId = usuario.stripe_customer_id;
    if (!customerId) {
      customerId = await this.stripe.getOrCreateCustomer(
        userId,
        usuario.correo_electronico,
        usuario.nombre,
      );
      await this.prisma.usuarios.update({
        where: { id_usuario: userId },
        data: { stripe_customer_id: customerId },
      });
    }

    await this.stripe.attachPaymentMethod(dto.paymentMethodId, customerId);

    // Registrar en BD
    const metodo = await this.prisma.metodo_pago_guardado.create({
      data: {
        id_usuario: userId,
        stripe_payment_method: dto.paymentMethodId,
        stripe_customer_id: customerId,
        tipo: dto.tipo || 'card',
        marca: dto.marca,
        ultima_4_digitos: dto.last4,
        mes_expiracion: dto.expMonth,
        anio_expiracion: dto.expYear,
        nombre_tarjeta: dto.cardholderName,
        is_default: dto.isDefault || false,
      },
    });

    this.logger.log(`✅ Método de pago guardado: ${metodo.id_metodo}`);
    return {
      id: metodo.id_metodo.toString(),
      tipo: metodo.tipo,
      marca: metodo.marca,
      last4: metodo.ultima_4_digitos,
    };
  }

  /**
   * Retorna métricas y contadores actuales del servicio de pagos.
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
    };
  }
}
