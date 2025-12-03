import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  // Usamos `any` explícito para evitar intersecciones privadas problemáticas
  private stripe: any = null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      this.logger.warn('Stripe deshabilitado: STRIPE_SECRET_KEY no configurada. Los flujos de pago usarán modo mock.');
      return;
    }
    // Cast a any para que TS no intente inferir intersecciones con `this`
    this.stripe = new (Stripe as any)(secretKey, {
      apiVersion: '2025-11-17.clover',
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
    this.logger.debug(`getOrCreateCustomer: userId=${userId}, email=${email}`);
    // Si Stripe no está inicializado, devolvemos mock para pruebas locales
    if (!this.stripe) {
      this.logger.warn('Stripe no inicializado — devolviendo customer mock');
      return `cus_mock_${userId}`;
    }

    // Intentar crear o recuperar un customer real en Stripe.
    // Nota: idealmente guardaríamos el customer.id en la tabla de usuarios para reusar,
    // pero para simplificar aquí creamos (o siempre retornamos) un customer nuevo con metadata.
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: { userId: String(userId) },
      });
      this.logger.debug(`Stripe customer creado: ${customer.id} for userId=${userId}`);
      return customer.id;
    } catch (err) {
      this.logger.error(`Error creando customer en Stripe: ${String(err)}`);
      // Fallback al mock para no romper flujos locales si Stripe falla
      return `cus_mock_${userId}`;
    }
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
    this.ensureStripe();
    this.logger.debug(`createPaymentIntent: ${JSON.stringify(params)}`);
    
    const options: Stripe.RequestOptions = {};
    if (idempotencyKey) {
      options.idempotencyKey = idempotencyKey;
      this.logger.debug(`Using idempotency key: ${idempotencyKey}`);
    }

    // If the caller provided a mock customer id (used in local dev), avoid sending it to Stripe
    // because Stripe will error with "No such customer". In that case create the PaymentIntent
    // without the customer field and log a warning so the developer can fix the customer flow.
    const paymentIntentPayload: any = {
      amount: params.amount,
      currency: params.currency,
      metadata: params.metadata,
      automatic_payment_methods: { enabled: true },
    };
    if (params.customerId && !String(params.customerId).startsWith('cus_mock_')) {
      paymentIntentPayload.customer = params.customerId;
    } else if (params.customerId && String(params.customerId).startsWith('cus_mock_')) {
      this.logger.warn(`Omitting mock customer when creating PaymentIntent: ${params.customerId}`);
    }

    return await this.stripe.paymentIntents.create(paymentIntentPayload, options);
  }

  /**
   * Confirma un PaymentIntent existente (para flujos server-side).
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    this.ensureStripe();
    return await this.stripe.paymentIntents.confirm(paymentIntentId);
  }

  /**
   * Obtiene detalles de un PaymentIntent por ID.
   */
  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    this.ensureStripe();
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Crea un reembolso para un PaymentIntent.
   */
  async createRefund(paymentIntentId: string): Promise<Stripe.Refund> {
    this.ensureStripe();
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
    this.ensureStripe();
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  /**
   * Guarda un método de pago (tokenizado) asociado al customer.
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<Stripe.PaymentMethod> {
    this.ensureStripe();
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
    this.ensureStripe();
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
    this.ensureStripe();
    return await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  private ensureStripe(): asserts this is { stripe: Stripe } {
    if (!this.stripe) {
      throw new Error('Stripe no está configurado. Define STRIPE_SECRET_KEY para habilitar pagos.');
    }
  }
}
