import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY no configurada en variables de entorno');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover',
    });
    this.logger.log('✅ Stripe SDK inicializado');
  }

  /**
   * Obtiene o crea un Stripe Customer para el usuario dado.
   */
  async getOrCreateCustomer(
    userId: bigint,
    email: string,
    name?: string,
  ): Promise<string> {
    // En producción, buscar/crear customer en Stripe y actualizar usuarios.stripe_customer_id
    // Por ahora retornamos mock para pruebas
    this.logger.debug(`getOrCreateCustomer: userId=${userId}, email=${email}`);
    // TODO: implementar lógica real con this.stripe.customers.create/retrieve
    return `cus_mock_${userId}`;
  }

  /**
   * Crea un PaymentIntent de Stripe para el monto especificado.
   * @param params Parámetros del PaymentIntent
   * @param idempotencyKey Clave de idempotencia para evitar cobros duplicados
   */
  async createPaymentIntent(
    params: {
      amount: number; // en centavos
      currency: string;
      customerId?: string;
      metadata?: Record<string, string>;
    },
    idempotencyKey?: string,
  ): Promise<Stripe.PaymentIntent> {
    this.logger.debug(`createPaymentIntent: ${JSON.stringify(params)}`);
    
    const options: Stripe.RequestOptions = {};
    if (idempotencyKey) {
      options.idempotencyKey = idempotencyKey;
      this.logger.debug(`Using idempotency key: ${idempotencyKey}`);
    }

    return await this.stripe.paymentIntents.create(
      {
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        metadata: params.metadata,
        automatic_payment_methods: { enabled: true },
      },
      options,
    );
  }

  /**
   * Confirma un PaymentIntent existente (para flujos server-side).
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.confirm(paymentIntentId);
  }

  /**
   * Obtiene detalles de un PaymentIntent por ID.
   */
  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Crea un reembolso para un PaymentIntent.
   */
  async createRefund(paymentIntentId: string): Promise<Stripe.Refund> {
    return await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  }

  /**
   * Valida firma de webhook de Stripe.
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  /**
   * Guarda un método de pago (tokenizado) asociado al customer.
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    return await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  /**
   * Lista métodos de pago guardados de un customer.
   */
  async listPaymentMethods(
    customerId: string,
  ): Promise<Stripe.PaymentMethod[]> {
    const response = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return response.data;
  }

  /**
   * Desvincula (elimina) un método de pago del customer.
   */
  async detachPaymentMethod(
    paymentMethodId: string,
  ): Promise<Stripe.PaymentMethod> {
    return await this.stripe.paymentMethods.detach(paymentMethodId);
  }
}
