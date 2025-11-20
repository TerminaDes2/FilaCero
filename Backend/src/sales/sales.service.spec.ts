import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CloseSaleDto } from './dto/close-sale.dto';

type MockedPrisma = {
  $transaction: jest.Mock;
  venta: {
    findUnique: jest.Mock;
  };
};

describe('SalesService', () => {
  const currentUser = { id_usuario: BigInt(99) } as const;

  function createServiceWithTransaction(txFactory: () => any, findOneReturn: any) {
    const prismaMock: MockedPrisma = {
      $transaction: jest.fn(async (cb) => cb(txFactory())),
      venta: {
        findUnique: jest.fn().mockResolvedValue(findOneReturn),
      },
    };

    return {
      service: new SalesService(prismaMock as any),
      prismaMock,
    };
  }

  test('create throws if no items provided', async () => {
    const { service } = createServiceWithTransaction(
      () => ({
        producto: { findMany: jest.fn() },
        inventario: { findMany: jest.fn() },
        venta: { create: jest.fn(), update: jest.fn() },
        detalle_venta: {
          create: jest.fn(),
          count: jest.fn(),
          deleteMany: jest.fn(),
        },
      }),
      null,
    );

    const dto = {
      id_negocio: '1',
      items: [],
    } as unknown as CreateSaleDto;

    await expect(service.create(dto, currentUser as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  test('create registers sale with valid inventory', async () => {
    const detalleCreate = jest.fn();
    const ventaRecord = {
      id_venta: BigInt(1),
      estado: 'pagada',
      detalle_venta: [],
    };

    const txFactory = () => ({
      producto: {
        findMany: jest.fn().mockResolvedValue([
          { id_producto: BigInt(10), nombre: 'Producto 10', precio: new Prisma.Decimal(20), estado: 'activo' },
          { id_producto: BigInt(11), nombre: 'Producto 11', precio: new Prisma.Decimal(55.5), estado: 'activo' },
        ]),
      },
      inventario: {
        findMany: jest.fn().mockResolvedValue([
          { id_producto: BigInt(10), cantidad_actual: new Prisma.Decimal(10) },
          { id_producto: BigInt(11), cantidad_actual: new Prisma.Decimal(5) },
        ]),
        updateMany: jest.fn(),
      },
      venta: {
        create: jest.fn().mockResolvedValue({ id_venta: BigInt(1) }),
        update: jest.fn(),
      },
      detalle_venta: {
        create: detalleCreate.mockResolvedValue({ id_detalle: BigInt(500) }),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
      movimientos_inventario: {
        create: jest.fn(),
      },
      pedido: {
        create: jest.fn().mockResolvedValue({ id_pedido: BigInt(300) }),
      },
    });

    const { service, prismaMock } = createServiceWithTransaction(txFactory, ventaRecord);

    const dto = {
      id_negocio: '1',
      cerrar: true,
      items: [
        { id_producto: '10', cantidad: 2 },
        { id_producto: '11', cantidad: 1, precio_unitario: 60 },
      ],
    } as unknown as CreateSaleDto;

    const result = await service.create(dto, currentUser as any);

    expect(result).toEqual(expect.objectContaining({ id_venta: BigInt(1) }));
    expect(detalleCreate).toHaveBeenCalledTimes(2);
    expect(prismaMock.venta.findUnique).toHaveBeenCalledWith({
      where: { id_venta: BigInt(1) },
      include: expect.any(Object),
    });
  });

  test('create aborts when stock is insufficient', async () => {
    const txFactory = () => ({
      producto: {
        findMany: jest.fn().mockResolvedValue([
          { id_producto: BigInt(10), nombre: 'Producto 10', precio: new Prisma.Decimal(20), estado: 'activo' },
        ]),
      },
      inventario: {
        findMany: jest.fn().mockResolvedValue([
          { id_producto: BigInt(10), cantidad_actual: new Prisma.Decimal(1) },
        ]),
        updateMany: jest.fn(),
      },
      venta: {
        create: jest.fn(),
        update: jest.fn(),
      },
      detalle_venta: {
        create: jest.fn().mockResolvedValue({ id_detalle: BigInt(600) }),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
      movimientos_inventario: {
        create: jest.fn(),
      },
      pedido: {
        create: jest.fn(),
      },
    });

    const { service } = createServiceWithTransaction(txFactory, null);

    const dto = {
      id_negocio: '1',
      items: [{ id_producto: '10', cantidad: 5 }],
    } as unknown as CreateSaleDto;

    await expect(service.create(dto, currentUser as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  test('close transitions an open sale to paid', async () => {
    const ventaUpdate = jest.fn();

    const txFactory = () => ({
      venta: {
        findUnique: jest.fn().mockResolvedValue({ estado: 'abierta' }),
        update: ventaUpdate.mockResolvedValue(undefined),
      },
      detalle_venta: {
        count: jest.fn().mockResolvedValue(1),
      },
    });

    const ventaRecord = { id_venta: BigInt(1), estado: 'pagada', detalle_venta: [] };
    const { service } = createServiceWithTransaction(txFactory, ventaRecord);

    const dto = { id_tipo_pago: '2' } as CloseSaleDto;
    const result = await service.close('1', dto);

    expect(result).toEqual(expect.objectContaining({ estado: 'pagada' }));
    expect(ventaUpdate).toHaveBeenCalledWith({
      where: { id_venta: BigInt(1) },
      data: expect.objectContaining({ estado: 'pagada' }),
    });
  });

  test('cancel removes sale details and marks as cancelled', async () => {
    const deleteMany = jest.fn();
    const ventaUpdate = jest.fn();

    const txFactory = () => ({
      venta: {
        findUnique: jest.fn().mockResolvedValue({ estado: 'abierta' }),
        update: ventaUpdate.mockResolvedValue(undefined),
      },
      detalle_venta: {
        deleteMany: deleteMany.mockResolvedValue(undefined),
      },
    });

    const ventaRecord = { id_venta: BigInt(1), estado: 'cancelada', detalle_venta: [] };
    const { service } = createServiceWithTransaction(txFactory, ventaRecord);

    const result = await service.cancel('1');

    expect(result).toEqual(expect.objectContaining({ estado: 'cancelada' }));
    expect(deleteMany).toHaveBeenCalledWith({ where: { id_venta: BigInt(1) } });
    expect(ventaUpdate).toHaveBeenCalledWith({
      where: { id_venta: BigInt(1) },
      data: { estado: 'cancelada', fecha_venta: null },
    });
  });

  describe('cashout flow', () => {
    const user = { id_usuario: BigInt(1) } as const;
    const negocioId = '5';

    function buildVentas() {
      const cashSaleDate = new Date('2025-11-18T09:15:00.000Z');
      const cardSaleDate = new Date('2025-11-18T09:45:00.000Z');

      return [
        {
          id_venta: BigInt(101),
          fecha_venta: cashSaleDate,
          total: new Prisma.Decimal(100),
          id_tipo_pago: BigInt(1),
          tipo_pago: { tipo: 'efectivo' },
          detalle_venta: [],
        },
        {
          id_venta: BigInt(102),
          fecha_venta: cardSaleDate,
          total: null,
          id_tipo_pago: BigInt(2),
          tipo_pago: { tipo: 'tarjeta' },
          detalle_venta: [
            { cantidad: 1, precio_unitario: new Prisma.Decimal(40) },
            { cantidad: 2, precio_unitario: new Prisma.Decimal(5) },
          ],
        },
      ];
    }

    test('cashoutSummary aggregates sales and suggests opening amount', async () => {
      const cortePrevio = {
        id_corte: BigInt(7),
        id_negocio: BigInt(5),
        id_usuario: BigInt(99),
        fecha_inicio: new Date('2025-11-17T06:00:00.000Z'),
        fecha_fin: new Date('2025-11-18T08:30:00.000Z'),
        monto_inicial: new Prisma.Decimal(120),
        monto_final: new Prisma.Decimal(200),
        ventas_totales: 4,
      } as const;

      const prismaMock = {
        corte_caja: {
          findFirst: jest.fn().mockResolvedValue(cortePrevio),
        },
        venta: {
          findMany: jest.fn().mockResolvedValue(buildVentas()),
        },
        $transaction: jest.fn(),
      } as any;

      const service = new SalesService(prismaMock);
      const fechaCorte = new Date('2025-11-18T11:00:00.000Z');

      const result = await service.cashoutSummary(
        { id_negocio: negocioId, fecha_fin: fechaCorte, todo_el_dia: true } as any,
        user as any,
      );

      const expectedStart = new Date(fechaCorte);
      expectedStart.setHours(0, 0, 0, 0);

      expect(prismaMock.corte_caja.findFirst).toHaveBeenCalledWith({
        where: { id_negocio: BigInt(5) },
        orderBy: { fecha_fin: 'desc' },
      });
      expect(prismaMock.venta.findMany).toHaveBeenCalledWith({
        where: {
          id_negocio: BigInt(5),
          estado: 'pagada',
          fecha_venta: {
            gte: expectedStart,
            lte: fechaCorte,
          },
        },
        select: expect.any(Object),
        orderBy: { fecha_venta: 'desc' },
      });

      expect(result).toMatchObject({
        businessId: negocioId,
        totals: {
          salesCount: 2,
          salesAmount: 150,
          expectedCash: 100,
          declaredCash: null,
        },
        opening: {
          suggested: 200,
          declared: 200,
        },
        lastCashout: {
          id: cortePrevio.id_corte.toString(),
        },
      });

      expect(result.range.from).toBe(expectedStart.toISOString());
      expect(result.range.to).toBe(fechaCorte.toISOString());

      expect(result.paymentBreakdown).toHaveLength(2);
      expect(result.paymentBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id_tipo_pago: '1', label: 'efectivo', total: 100, tickets: 1 }),
          expect.objectContaining({ id_tipo_pago: '2', label: 'tarjeta', total: 50, tickets: 1 }),
        ]),
      );

      expect(result.recentSales).toHaveLength(2);
      expect(result.recentSales).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: '101', total: 100, paymentLabel: 'efectivo' }),
          expect.objectContaining({ id: '102', total: 50, paymentLabel: 'tarjeta' }),
        ]),
      );
    });

    test('createCashout persists corte and returns snapshot', async () => {
      const cortePrevio = {
        id_corte: BigInt(8),
        id_negocio: BigInt(5),
        id_usuario: BigInt(21),
        fecha_inicio: new Date('2025-11-18T02:00:00.000Z'),
        fecha_fin: new Date('2025-11-18T08:00:00.000Z'),
        monto_inicial: new Prisma.Decimal(80),
        monto_final: new Prisma.Decimal(120),
        ventas_totales: 3,
      } as const;

      const nuevoCorte = {
        id_corte: BigInt(9),
        id_negocio: BigInt(5),
        id_usuario: user.id_usuario,
        fecha_inicio: cortePrevio.fecha_fin,
        fecha_fin: new Date('2025-11-18T12:00:00.000Z'),
        monto_inicial: new Prisma.Decimal(25),
        monto_final: new Prisma.Decimal(55),
        ventas_totales: 2,
      } as const;

      const tx = {
        corte_caja: {
          findFirst: jest.fn().mockResolvedValue(cortePrevio),
          create: jest.fn().mockResolvedValue(nuevoCorte),
        },
        venta: {
          findMany: jest.fn().mockResolvedValue(buildVentas()),
        },
      } as any;

      const prismaMock = {
        $transaction: jest.fn(async (cb: any) => cb(tx)),
      } as any;

      const service = new SalesService(prismaMock);
      const fechaFin = new Date('2025-11-18T12:00:00.000Z');
      const expectedStart = new Date(fechaFin);
      expectedStart.setHours(0, 0, 0, 0);

      const result = await service.createCashout(
        {
          id_negocio: negocioId,
          fecha_fin: fechaFin,
          monto_inicial: 25,
          monto_final: 55,
        } as any,
        user as any,
      );

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      const createArgs = tx.corte_caja.create.mock.calls[0][0];
      expect(createArgs.data.id_negocio).toBe(BigInt(5));
      expect(createArgs.data.id_usuario).toBe(user.id_usuario);
      expect(createArgs.data.fecha_inicio).toEqual(expectedStart);
      expect(createArgs.data.fecha_fin).toEqual(fechaFin);
      expect(createArgs.data.monto_inicial?.toString()).toBe('25');
      expect(createArgs.data.monto_final?.toString()).toBe('55');
      expect(createArgs.data.ventas_totales).toBe(2);

      expect(result.cashout).toBe(nuevoCorte);
      expect(result.resumen).toMatchObject({
        businessId: negocioId,
        totals: {
          salesCount: 2,
          salesAmount: 150,
          expectedCash: 100,
          declaredCash: 55,
        },
        opening: {
          suggested: 55,
          declared: 25,
        },
        lastCashout: {
          id: nuevoCorte.id_corte.toString(),
          finalAmount: 55,
          salesCount: 2,
        },
      });

      expect(result.resumen.range.from).toBe(expectedStart.toISOString());
      expect(result.resumen.range.to).toBe(fechaFin.toISOString());
    });

    test('cashoutHistory returns formatted entries', async () => {
      const corteUno = {
        id_corte: BigInt(11),
        id_negocio: BigInt(5),
        id_usuario: BigInt(77),
        fecha_inicio: new Date('2025-11-18T00:00:00.000Z'),
        fecha_fin: new Date('2025-11-18T18:00:00.000Z'),
        monto_inicial: new Prisma.Decimal(120),
        monto_final: new Prisma.Decimal(260),
        ventas_totales: 6,
      } as const;

      const corteDos = {
        id_corte: BigInt(10),
        id_negocio: BigInt(5),
        id_usuario: BigInt(77),
        fecha_inicio: new Date('2025-11-17T00:00:00.000Z'),
        fecha_fin: new Date('2025-11-17T18:00:00.000Z'),
        monto_inicial: new Prisma.Decimal(90),
        monto_final: new Prisma.Decimal(200),
        ventas_totales: 5,
      } as const;

      const ventaMock = jest
        .fn()
        .mockResolvedValueOnce([
          {
            id_venta: BigInt(1),
            fecha_venta: new Date('2025-11-18T10:00:00.000Z'),
            total: new Prisma.Decimal(140),
            id_tipo_pago: BigInt(1),
            tipo_pago: { tipo: 'efectivo' },
            detalle_venta: [],
          },
          {
            id_venta: BigInt(2),
            fecha_venta: new Date('2025-11-18T11:00:00.000Z'),
            total: new Prisma.Decimal(80),
            id_tipo_pago: BigInt(2),
            tipo_pago: { tipo: 'tarjeta' },
            detalle_venta: [],
          },
        ])
        .mockResolvedValueOnce([
          {
            id_venta: BigInt(3),
            fecha_venta: new Date('2025-11-17T09:00:00.000Z'),
            total: new Prisma.Decimal(110),
            id_tipo_pago: BigInt(1),
            tipo_pago: { tipo: 'efectivo' },
            detalle_venta: [],
          },
        ]);

      const prismaMock = {
        corte_caja: {
          findMany: jest.fn().mockResolvedValue([corteUno, corteDos]),
        },
        venta: {
          findMany: ventaMock,
        },
      } as any;

      const service = new SalesService(prismaMock);

      const result = await service.cashoutHistory(
        {
          id_negocio: negocioId,
          limite: 5,
          incluir_recientes: true,
          limite_recientes: 2,
        } as any,
        user as any,
      );

      expect(prismaMock.corte_caja.findMany).toHaveBeenCalledWith({
        where: { id_negocio: BigInt(5) },
        orderBy: { fecha_fin: 'desc' },
        take: 5,
      });

      expect(ventaMock).toHaveBeenCalledTimes(2);
      const firstCallArgs = ventaMock.mock.calls[0][0];
      expect(firstCallArgs.where.fecha_venta).toMatchObject({
        gte: corteUno.fecha_inicio,
        lte: corteUno.fecha_fin,
      });

      expect(result.businessId).toBe(negocioId);
      expect(result.items).toHaveLength(2);

      const first = result.items[0];
      expect(first.id).toBe(corteUno.id_corte.toString());
      expect(first.startedAt).toBe(corteUno.fecha_inicio.toISOString());
      expect(first.finishedAt).toBe(corteUno.fecha_fin.toISOString());
      expect(first.totals).toMatchObject({
        salesAmount: 220,
        declaredCash: 260,
        expectedCash: 140,
        difference: 120,
      });
      expect(first.opening).toMatchObject({ declared: 120 });
      expect(first.paymentBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'efectivo', total: 140 }),
          expect.objectContaining({ label: 'tarjeta', total: 80 }),
        ]),
      );
      expect(first.recentSales.length).toBeLessThanOrEqual(2);
      expect(first.recordedBy).toBe(corteUno.id_usuario.toString());
    });
  });
});
