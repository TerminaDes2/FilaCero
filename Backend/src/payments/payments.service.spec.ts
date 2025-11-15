import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import Stripe from 'stripe';
import { Decimal } from '@prisma/client/runtime/library';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let stripeService: StripeService;

  // Mock data
  const mockUserId = BigInt(1);
  const mockPedidoId = BigInt(100);
  const mockCustomerId = 'cus_test123';
  const mockPaymentIntentId = 'pi_test123';

  const mockUsuario = {
    id_usuario: mockUserId,
    nombre: 'Test User',
    correo_electronico: 'test@test.com',
    numero_telefono: '+5212345678',
    password_hash: 'hash',
    id_rol: BigInt(3),
    stripe_customer_id: null,
    correo_verificado: true,
    sms_verificado: false,
    credencial_verificada: false,
    numero_cuenta: null,
    fecha_nacimiento: null,
    fecha_registro: new Date(),
    correo_verificado_en: null,
    sms_verificado_en: null,
    credencial_verificada_en: null,
    verification_token: null,
    verification_token_expires: null,
    avatar_url: null,
    credential_url: null,
    edad: null,
    estado: null,
  };

  const mockPedido = {
    id_pedido: mockPedidoId,
    id_negocio: BigInt(1),
    id_usuario: mockUserId,
    id_tipo_pago: null,
    estado: 'pendiente',
    total: new Decimal(150.0),
    fecha_creacion: new Date(),
    fecha_confirmacion: null,
    fecha_preparacion: null,
    fecha_listo: null,
    fecha_entrega: null,
    notas_cliente: null,
    tiempo_entrega: null,
    nombre_cliente: null,
    email_cliente: null,
    telefono_cliente: null,
    creado_en: new Date(),
    actualizado_en: new Date(),
  };

  const mockPaymentIntent: Stripe.PaymentIntent = {
    id: mockPaymentIntentId,
    object: 'payment_intent',
    amount: 15000,
    currency: 'mxn',
    status: 'requires_payment_method',
    client_secret: 'pi_test123_secret_abc',
    customer: mockCustomerId,
    created: Date.now(),
    livemode: false,
    payment_method: null,
    payment_method_types: ['card'],
    // Otros campos de Stripe.PaymentIntent
  } as Stripe.PaymentIntent;

  const mockTransaccion = {
    id_transaccion: BigInt(1),
    id_pedido: mockPedidoId,
    stripe_payment_id: mockPaymentIntentId,
    stripe_customer_id: mockCustomerId,
    monto: new Decimal(150.0),
    moneda: 'mxn',
    estado: 'pending',
    metodo_pago: 'tarjeta',
    ultima_4_digitos: null,
    marca_tarjeta: null,
    tipo_tarjeta: null,
    error_codigo: null,
    error_mensaje: null,
    metadata: null,
    stripe_fee: null,
    net_amount: null,
    refund_id: null,
    refunded_at: null,
    creado_en: new Date(),
    actualizado_en: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            pedido: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            usuarios: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            transaccion_pago: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            metodo_pago_guardado: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: StripeService,
          useValue: {
            getOrCreateCustomer: jest.fn(),
            createPaymentIntent: jest.fn(),
            confirmPaymentIntent: jest.fn(),
            retrievePaymentIntent: jest.fn(),
            attachPaymentMethod: jest.fn(),
            listPaymentMethods: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    stripeService = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('debería crear un PaymentIntent exitosamente', async () => {
      // Arrange
      jest.spyOn(prismaService.pedido, 'findUnique').mockResolvedValue(mockPedido as any);
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(mockUsuario);
      jest.spyOn(stripeService, 'getOrCreateCustomer').mockResolvedValue(mockCustomerId);
      jest.spyOn(stripeService, 'createPaymentIntent').mockResolvedValue(mockPaymentIntent);
      jest.spyOn(prismaService.transaccion_pago, 'create').mockResolvedValue(mockTransaccion as any);
      jest.spyOn(prismaService.usuarios, 'update').mockResolvedValue(mockUsuario);

      // Act
      const result = await service.createPaymentIntent(mockUserId, {
        pedidoId: mockPedidoId,
      });

      // Assert
      expect(result).toHaveProperty('clientSecret');
      expect(result).toHaveProperty('paymentIntentId', mockPaymentIntentId);
      expect(result).toHaveProperty('transaccionId');
      expect(prismaService.pedido.findUnique).toHaveBeenCalledWith({
        where: { id_pedido: mockPedidoId },
      });
      expect(stripeService.createPaymentIntent).toHaveBeenCalled();
      expect(prismaService.transaccion_pago.create).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el pedido no existe', async () => {
      // Arrange
      jest.spyOn(prismaService.pedido, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createPaymentIntent(mockUserId, { pedidoId: mockPedidoId }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.pedido.findUnique).toHaveBeenCalled();
    });

    it('debería lanzar ForbiddenException si el pedido no pertenece al usuario', async () => {
      // Arrange
      const pedidoOtroUsuario = { ...mockPedido, id_usuario: BigInt(999) };
      jest.spyOn(prismaService.pedido, 'findUnique').mockResolvedValue(pedidoOtroUsuario as any);

      // Act & Assert
      await expect(
        service.createPaymentIntent(mockUserId, { pedidoId: mockPedidoId }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debería lanzar BadRequestException si el pedido está cancelado', async () => {
      // Arrange
      const pedidoCancelado = { ...mockPedido, estado: 'cancelado' };
      jest.spyOn(prismaService.pedido, 'findUnique').mockResolvedValue(pedidoCancelado as any);

      // Act & Assert
      await expect(
        service.createPaymentIntent(mockUserId, { pedidoId: mockPedidoId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si el monto es inválido', async () => {
      // Arrange
      const pedidoMontoInvalido = { ...mockPedido, total: new Decimal(0) };
      jest.spyOn(prismaService.pedido, 'findUnique').mockResolvedValue(pedidoMontoInvalido as any);

      // Act & Assert
      await expect(
        service.createPaymentIntent(mockUserId, { pedidoId: mockPedidoId }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmPayment', () => {
    it('debería confirmar un pago exitosamente', async () => {
      // Arrange
      jest.spyOn(prismaService.transaccion_pago, 'findFirst').mockResolvedValue(mockTransaccion);
      jest.spyOn(prismaService.transaccion_pago, 'update').mockResolvedValue({
        ...mockTransaccion,
        estado: 'succeeded',
      });
      jest.spyOn(prismaService.pedido, 'update').mockResolvedValue({
        ...mockPedido,
        estado: 'confirmado',
      });

      // Act
      const result = await service.confirmPayment({
        paymentIntentId: mockPaymentIntentId,
        last4: '4242',
        brand: 'visa',
        cardType: 'credit',
      });

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('pedidoId');
      expect(prismaService.transaccion_pago.update).toHaveBeenCalledWith({
        where: { id_transaccion: mockTransaccion.id_transaccion },
        data: expect.objectContaining({
          estado: 'succeeded',
          ultima_4_digitos: '4242',
        }),
      });
      expect(prismaService.pedido.update).toHaveBeenCalledWith({
        where: { id_pedido: mockPedidoId },
        data: { estado: 'confirmado' },
      });
    });

    it('debería lanzar NotFoundException si la transacción no existe', async () => {
      // Arrange
      jest.spyOn(prismaService.transaccion_pago, 'findFirst').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.confirmPayment({ paymentIntentId: 'pi_nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleWebhookEvent', () => {
    it('debería procesar payment_intent.succeeded correctamente', async () => {
      // Arrange
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: mockPaymentIntentId,
            amount: 15000,
            status: 'succeeded',
          },
        },
      } as Stripe.Event;

      jest.spyOn(prismaService.transaccion_pago, 'findFirst').mockResolvedValue(mockTransaccion);
      jest.spyOn(prismaService.transaccion_pago, 'update').mockResolvedValue({
        ...mockTransaccion,
        estado: 'succeeded',
      });
      jest.spyOn(prismaService.pedido, 'update').mockResolvedValue({
        ...mockPedido,
        estado: 'confirmado',
      });

      // Act
      await service.handleWebhookEvent(mockEvent);

      // Assert
      expect(prismaService.transaccion_pago.update).toHaveBeenCalledWith({
        where: { id_transaccion: mockTransaccion.id_transaccion },
        data: expect.objectContaining({ estado: 'succeeded' }),
      });
    });

    it('debería procesar payment_intent.payment_failed correctamente', async () => {
      // Arrange
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: mockPaymentIntentId,
            last_payment_error: {
              code: 'card_declined',
              message: 'Your card was declined',
            },
          },
        },
      } as Stripe.Event;

      jest.spyOn(prismaService.transaccion_pago, 'findFirst').mockResolvedValue(mockTransaccion);
      jest.spyOn(prismaService.transaccion_pago, 'update').mockResolvedValue({
        ...mockTransaccion,
        estado: 'failed',
      } as any);

      // Act
      await service.handleWebhookEvent(mockEvent);

      // Assert
      expect(prismaService.transaccion_pago.update).toHaveBeenCalledWith({
        where: { id_transaccion: mockTransaccion.id_transaccion },
        data: expect.objectContaining({
          estado: 'failed',
          error_codigo: 'card_declined',
        }),
      });
    });

    it('debería procesar payment_intent.canceled correctamente', async () => {
      // Arrange
      const mockEvent = {
        type: 'payment_intent.canceled',
        data: {
          object: {
            id: mockPaymentIntentId,
          },
        },
      } as Stripe.Event;

      jest.spyOn(prismaService.transaccion_pago, 'findFirst').mockResolvedValue(mockTransaccion);
      jest.spyOn(prismaService.transaccion_pago, 'update').mockResolvedValue({
        ...mockTransaccion,
        estado: 'canceled',
      } as any);

      // Act
      await service.handleWebhookEvent(mockEvent);

      // Assert
      expect(prismaService.transaccion_pago.update).toHaveBeenCalledWith({
        where: { id_transaccion: mockTransaccion.id_transaccion },
        data: expect.objectContaining({ estado: 'canceled' }),
      });
    });
  });

  describe('getPaymentMethods', () => {
    it('debería retornar lista de métodos de pago del usuario', async () => {
      // Arrange
      const mockMetodos = [
        {
          id_metodo: BigInt(1),
          stripe_payment_method: 'pm_test1',
          tipo: 'card',
          marca: 'visa',
          ultima_4_digitos: '4242',
          mes_expiracion: 12,
          anio_expiracion: 2025,
          is_default: true,
        },
      ];

      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({
        ...mockUsuario,
        stripe_customer_id: mockCustomerId,
      });
      jest.spyOn(prismaService.metodo_pago_guardado, 'findMany').mockResolvedValue(mockMetodos as any);

      // Act
      const result = await service.getPaymentMethods(mockUserId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('tipo', 'card');
      expect(result[0]).toHaveProperty('last4', '4242');
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPaymentMethods(mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('savePaymentMethod', () => {
    it('debería guardar un método de pago exitosamente', async () => {
      // Arrange
      const mockPaymentMethod = 'pm_test123';
      jest.spyOn(prismaService.usuarios, 'findUnique').mockResolvedValue({
        ...mockUsuario,
        stripe_customer_id: mockCustomerId,
      });
      jest.spyOn(stripeService, 'attachPaymentMethod').mockResolvedValue({} as Stripe.PaymentMethod);
      jest.spyOn(prismaService.metodo_pago_guardado, 'create').mockResolvedValue({
        id_metodo: BigInt(1),
        stripe_payment_method: mockPaymentMethod,
        tipo: 'card',
        marca: 'visa',
        ultima_4_digitos: '4242',
      } as any);

      // Act
      const result = await service.savePaymentMethod(mockUserId, {
        paymentMethodId: mockPaymentMethod,
        last4: '4242',
        tipo: 'card',
        marca: 'visa',
      });

      // Assert
      expect(result).toHaveProperty('id');
      expect(stripeService.attachPaymentMethod).toHaveBeenCalledWith(
        mockPaymentMethod,
        mockCustomerId,
      );
      expect(prismaService.metodo_pago_guardado.create).toHaveBeenCalled();
    });
  });
});
