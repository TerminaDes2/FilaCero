import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { SavePaymentMethodDto } from './dto/save-payment-method.dto';
import { AuthGuard } from '@nestjs/passport';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { RequireFeature } from '../common/decorators/require-feature.decorator';

@ApiTags('payments')
@Controller('api/payments')
@UseGuards(FeatureFlagGuard) // Aplicar guard a nivel de controlador
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * GET /api/payments/metrics
   * Retorna métricas de pagos procesados (solo para monitoreo).
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Métricas del sistema de pagos',
    description:
      'Retorna contadores de pagos creados, exitosos, fallidos, cancelados, reembolsados y monto total procesado. Útil para dashboards de monitoreo.',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas actuales',
    schema: {
      example: {
        total_payments_created: 150,
        total_payments_succeeded: 120,
        total_payments_failed: 20,
        total_payments_canceled: 8,
        total_payments_refunded: 2,
        total_amount_processed: 45320.5,
        timestamp: '2025-11-15T16:30:00.000Z',
      },
    },
  })
  async getMetrics() {
    return this.paymentsService.getMetrics();
  }

  /**
   * POST /api/payments/create-intent
   * Crea un PaymentIntent para el pedido especificado.
   */
  @Post('create-intent')
  @UseGuards(AuthGuard('jwt'))
  @RequireFeature('PAYMENTS_ENABLED')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear PaymentIntent de Stripe',
    description:
      'Crea un PaymentIntent para procesar el pago de un pedido. Requiere JWT token. Valida que el pedido pertenezca al usuario autenticado y que el monto sea válido.',
  })
  @ApiResponse({
    status: 201,
    description: 'PaymentIntent creado exitosamente',
    schema: {
      example: {
        clientSecret: 'pi_3abc123_secret_xyz',
        paymentIntentId: 'pi_3abc123',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Monto inválido o pedido cancelado' })
  @ApiResponse({ status: 403, description: 'Pedido no pertenece al usuario' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes (rate limit)' })
  @ApiResponse({ status: 503, description: 'Funcionalidad temporalmente deshabilitada' })
  async createIntent(@Req() req: any, @Body() dto: CreatePaymentIntentDto) {
    const userId = BigInt(req.user.userId);
    return await this.paymentsService.createPaymentIntent(userId, dto);
  }

  /**
   * POST /api/payments/confirm
   * Confirma manualmente un pago (opcional, si no usas webhook).
   */
  @Post('confirm')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Confirmar pago manualmente',
    description:
      'Confirma un pago marcando transacción como succeeded y pedido como confirmado. Normalmente se usa webhook, pero este endpoint permite confirmación manual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pago confirmado exitosamente',
    schema: {
      example: { success: true, pedidoId: '123' },
    },
  })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes (rate limit)' })
  async confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return await this.paymentsService.confirmPayment(dto);
  }

  /**
   * POST /api/payments/webhook
   * Webhook de Stripe para eventos de pago (payment_intent.succeeded, etc.)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Stripe',
    description:
      'Endpoint público para recibir eventos de Stripe (payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled, charge.refunded). Valida firma del webhook con STRIPE_WEBHOOK_SECRET.',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Firma del webhook generada por Stripe',
    required: true,
  })
  @ApiBody({
    description: 'Payload del evento Stripe en formato raw (no JSON parseado)',
    schema: { type: 'object' },
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook procesado exitosamente',
    schema: { example: { received: true } },
  })
  @ApiResponse({ status: 400, description: 'Firma inválida o payload vacío' })
  @ApiResponse({ status: 429, description: 'Demasiados webhooks (rate limit)' })
  @ApiResponse({
    status: 500,
    description:
      'Error procesando evento (Stripe reintentará automáticamente)',
  })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET no configurado');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Payload vacío');
    }

    let event;
    try {
      event = this.stripeService.constructWebhookEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid signature');
    }

    await this.paymentsService.handleWebhookEvent(event);
    return { received: true };
  }

  /**
   * GET /api/payments/methods
   * Retorna los métodos de pago guardados del usuario actual.
   */
  @Get('methods')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar métodos de pago guardados',
    description:
      'Obtiene tarjetas y métodos de pago guardados del usuario autenticado. Incluye marca, últimos 4 dígitos, expiración, y si es método por defecto.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de métodos de pago',
    schema: {
      example: [
        {
          id: '1',
          tipo: 'tarjeta',
          marca: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          isDefault: true,
        },
      ],
    },
  })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes (rate limit)' })
  @ApiResponse({ status: 503, description: 'Funcionalidad temporalmente deshabilitada' })
  async getPaymentMethods(@Req() req: any) {
    const userId = BigInt(req.user.userId);
    return await this.paymentsService.getPaymentMethods(userId);
  }

  /**
   * POST /api/payments/methods
   * Guarda un nuevo método de pago tokenizado.
   */
  @Post('methods')
  @UseGuards(AuthGuard('jwt'))
  @RequireFeature('SAVED_CARDS_ENABLED')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Guardar método de pago',
    description:
      'Guarda un nuevo método de pago (tarjeta tokenizada por Stripe Elements). Requiere paymentMethodId generado en frontend. Puede marcarse como método por defecto.',
  })
  @ApiResponse({
    status: 201,
    description: 'Método de pago guardado exitosamente',
    schema: {
      example: { id: '5', tipo: 'tarjeta', marca: 'mastercard', last4: '5555' },
    },
  })
  @ApiResponse({ status: 400, description: 'PaymentMethodId inválido' })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes (rate limit)' })
  @ApiResponse({ status: 503, description: 'Funcionalidad temporalmente deshabilitada' })
  async savePaymentMethod(
    @Req() req: any,
    @Body() dto: SavePaymentMethodDto,
  ) {
    const userId = BigInt(req.user.userId);
    return await this.paymentsService.savePaymentMethod(userId, dto);
  }
}
