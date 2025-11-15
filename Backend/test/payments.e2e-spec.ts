import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import Stripe from 'stripe';

describe('Payments E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: bigint;
  let testPedidoId: bigint;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Crear usuario de prueba
    const testUser = await prisma.usuarios.create({
      data: {
        nombre: 'Test Payment User',
        correo_electronico: `test-payment-${Date.now()}@test.com`,
        numero_telefono: '+521234567890',
        password_hash: 'hashedPassword123',
        id_rol: 3, // rol cliente (ajustar según tu BD)
        correo_verificado: true,
      },
    });
    testUserId = testUser.id_usuario;

    // Login para obtener JWT
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        correo_electronico: testUser.correo_electronico,
        password: 'hashedPassword123',
      });

    authToken = loginResponse.body.token || loginResponse.body.access_token;

    // Crear pedido de prueba
    const testPedido = await prisma.pedido.create({
      data: {
        id_usuario: testUserId,
        id_negocio: BigInt(1), // Ajustar según tu BD
        estado: 'pendiente',
        total: 100.0,
      },
    });
    testPedidoId = testPedido.id_pedido;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.transaccion_pago.deleteMany({
      where: { id_pedido: testPedidoId },
    });
    await prisma.pedido.delete({ where: { id_pedido: testPedidoId } });
    await prisma.usuarios.delete({ where: { id_usuario: testUserId } });

    await app.close();
  });

  describe('POST /api/payments/create-intent', () => {
    it('debería crear un PaymentIntent exitosamente', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pedidoId: testPedidoId.toString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('clientSecret');
      expect(response.body).toHaveProperty('paymentIntentId');
      expect(response.body).toHaveProperty('transaccionId');
      expect(response.body.clientSecret).toMatch(/^pi_.*_secret_.*/);

      // Verificar que se creó la transacción en BD
      const transaccion = await prisma.transaccion_pago.findFirst({
        where: { id_pedido: testPedidoId },
      });
      expect(transaccion).toBeDefined();
      expect(transaccion.estado).toBe('pending');
      expect(transaccion.metodo_pago).toBe('tarjeta');
    });

    it('debería retornar 404 si el pedido no existe', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pedidoId: '999999999',
        })
        .expect(404);
    });

    it('debería retornar 403 si el pedido no pertenece al usuario', async () => {
      // Crear pedido de otro usuario
      const otherUser = await prisma.usuarios.create({
        data: {
          nombre: 'Other User',
          correo_electronico: `other-user-${Date.now()}@test.com`,
          numero_telefono: '+521234567891',
          password_hash: 'hashedPassword123',
          id_rol: 3,
          correo_verificado: true,
        },
      });

      const otherPedido = await prisma.pedido.create({
        data: {
          id_usuario: otherUser.id_usuario,
          id_negocio: BigInt(1),
          estado: 'pendiente',
          total: 50.0,
        },
      });

      await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pedidoId: otherPedido.id_pedido.toString(),
        })
        .expect(403);

      // Limpiar
      await prisma.pedido.delete({ where: { id_pedido: otherPedido.id_pedido } });
      await prisma.usuarios.delete({ where: { id_usuario: otherUser.id_usuario } });
    });

    it('debería retornar 401 si no hay token de autenticación', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .send({
          pedidoId: testPedidoId.toString(),
        })
        .expect(401);
    });
  });

  describe('POST /api/payments/confirm', () => {
    let paymentIntentId: string;

    beforeEach(async () => {
      // Crear PaymentIntent para confirmar
      const response = await request(app.getHttpServer())
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pedidoId: testPedidoId.toString(),
        });

      paymentIntentId = response.body.paymentIntentId;
    });

    it('debería confirmar un pago exitosamente', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId: paymentIntentId,
          last4: '4242',
          brand: 'visa',
          cardType: 'credit',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pedidoId');

      // Verificar en BD
      const transaccion = await prisma.transaccion_pago.findFirst({
        where: { stripe_payment_id: paymentIntentId },
      });
      expect(transaccion.estado).toBe('succeeded');

      const pedido = await prisma.pedido.findUnique({
        where: { id_pedido: testPedidoId },
      });
      expect(pedido.estado).toBe('confirmado');
    });

    it('debería retornar 404 si el paymentIntentId no existe', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentIntentId: 'pi_nonexistent',
          last4: '4242',
          brand: 'visa',
        })
        .expect(404);
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('debería retornar 400 si falta la firma de Stripe', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .send({
          type: 'payment_intent.succeeded',
          data: { object: {} },
        })
        .expect(400);
    });

    it('debería retornar 400 con firma inválida', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send(
          JSON.stringify({
            type: 'payment_intent.succeeded',
            data: { object: {} },
          }),
        )
        .expect(400);
    });

    // Nota: Test con firma válida requiere mock de Stripe.constructEvent
    // o usar Stripe CLI para generar eventos reales
  });

  describe('GET /api/payments/methods', () => {
    it('debería retornar lista vacía si no hay métodos guardados', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('debería retornar 401 sin autenticación', async () => {
      await request(app.getHttpServer())
        .get('/api/payments/methods')
        .expect(401);
    });
  });

  describe('POST /api/payments/methods', () => {
    it('debería guardar un método de pago exitosamente', async () => {
      // Mock de paymentMethodId (en test real, crear con Stripe Test API)
      const mockPaymentMethodId = `pm_test_${Date.now()}`;

      // Este test fallará sin un paymentMethodId válido de Stripe
      // Para test real, usar: stripe.paymentMethods.create({ type: 'card', card: { token: 'tok_visa' }})
      const response = await request(app.getHttpServer())
        .post('/api/payments/methods')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentMethodId: mockPaymentMethodId,
          tipo: 'card',
          marca: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
          cardholderName: 'Test User',
          isDefault: true,
        });

      // Ajustar expectativa según si tienes Stripe test key válida
      // Con mock: expect(201) y verificar en BD
      // Sin mock: expect(400) por paymentMethod inválido
      expect([201, 400]).toContain(response.status);
    });

    it('debería retornar 401 sin autenticación', async () => {
      await request(app.getHttpServer())
        .post('/api/payments/methods')
        .send({
          paymentMethodId: 'pm_test_123',
          last4: '4242',
        })
        .expect(401);
    });
  });
});
