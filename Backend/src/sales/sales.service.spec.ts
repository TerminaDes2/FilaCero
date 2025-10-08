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
      },
      venta: {
        create: jest.fn().mockResolvedValue({ id_venta: BigInt(1) }),
        update: jest.fn(),
      },
      detalle_venta: {
        create: detalleCreate.mockResolvedValue(undefined),
        count: jest.fn(),
        deleteMany: jest.fn(),
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
      },
      venta: {
        create: jest.fn(),
        update: jest.fn(),
      },
      detalle_venta: {
        create: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
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
});
