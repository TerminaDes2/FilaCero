// Backend/src/sales/sales.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, corte_caja } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CloseSaleDto } from './dto/close-sale.dto';
import { FindSalesQueryDto } from './dto/find-sales.query';
import { SaleItemDto } from './dto/sale-item.dto';
import { CreateCashoutDto } from './dto/create-cashout.dto';
import { CashoutSummaryQueryDto } from './dto/cashout-summary.query';
import { CashoutHistoryQueryDto } from './dto/cashout-history.query';

// --- MODIFICADO ---
// La salida de prepareItems (itemsListos) tendrá un Decimal
interface NormalizedItem {
  idProducto: bigint;
  cantidad: number;
  precioUnitario: Prisma.Decimal; // <-- Tipo corregido
}
// --- FIN MODIFICACIÓN ---

interface CashoutPaymentBucket {
  idTipoPago: bigint | null;
  label: string;
  total: Prisma.Decimal;
  tickets: number;
}

interface CashoutSaleSnapshot {
  idVenta: bigint;
  fecha: Date | null;
  total: Prisma.Decimal;
  paymentLabel: string;
}

interface CashoutSnapshot {
  negocioId: bigint;
  range: { desde: Date; hasta: Date };
  totalVentas: Prisma.Decimal;
  totalTickets: number;
  buckets: CashoutPaymentBucket[];
  recientes: CashoutSaleSnapshot[];
  ultimoCorte?: corte_caja | null;
  sugerenciaInicio?: Prisma.Decimal | null;
}

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // --- MÉTODO 'CREATE' MODIFICADO ---
  async create(dto: CreateSaleDto, currentUser: { id_usuario: bigint }) {
    const negocioId = this.toBigInt(dto.id_negocio, 'id_negocio');
    const tipoPagoId = this.toBigInt(dto.id_tipo_pago);
    const usuarioId = currentUser?.id_usuario ?? undefined;

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos un producto en la venta');
    }

    const cerrar = dto.cerrar ?? true;
    
    // 1. Normalizamos los items (agrupa IDs duplicados)
    const itemsNormalizados = this.normalizeItems(dto.items);

    const transactionResult = await this.prisma.$transaction(async (tx) => {
      
      // 2. Validamos items, stock y OBTENEMOS precios de la BD
      const itemsListos = await this.prepareItems(tx, negocioId, itemsNormalizados);

      if (cerrar && itemsListos.length === 0) {
        throw new BadRequestException('No es posible cerrar la venta sin productos');
      }

      // --- 3. ¡CORRECCIÓN! Calcular el total de la venta ---
      const totalVenta = itemsListos.reduce((total, item) => {
        // Sumamos (precio del item * cantidad)
        return total.plus(item.precioUnitario.times(item.cantidad));
      }, new Prisma.Decimal(0)); // Empezamos en 0
      // --- FIN DE LA CORRECCIÓN ---


      // 4. Crear la Venta (usando el 'totalVenta' calculado)
      const venta = await tx.venta.create({
        data: {
          id_negocio: negocioId,
          id_usuario: usuarioId,
          id_tipo_pago: tipoPagoId,
          estado: cerrar ? 'pagada' : 'abierta',
          fecha_venta: cerrar ? new Date() : null,
          total: totalVenta, // <-- Usamos el total calculado
        },
      });

      // 5. Procesar cada item (Stock y Detalle)
      for (const item of itemsListos) {
        await tx.detalle_venta.create({
          data: {
            id_venta: venta.id_venta,
            id_producto: item.idProducto,
            cantidad: item.cantidad,
            precio_unitario: item.precioUnitario,
          },
        });
        // El ajuste de inventario y los movimientos se manejan desde los triggers
        // fn_trg_detalle_venta_inventario / fn_trg_detalle_venta_total definidos en db_filacero.sql
      }

      // 6. Lógica de 'abierta'
      if (!cerrar) {
        await tx.venta.update({
          where: { id_venta: venta.id_venta },
          data: { estado: 'abierta', fecha_venta: null },
        });
      }

      let pedidoCreado: any = null;
      if (cerrar) {
        pedidoCreado = await tx.pedido.create({
          data: {
            id_negocio: negocioId,
            id_usuario: usuarioId,
            id_tipo_pago: tipoPagoId,
            estado: 'pendiente',
            total: totalVenta,
            detalle_pedido: {
              create: itemsListos.map((item) => ({
                id_producto: item.idProducto,
                cantidad: item.cantidad,
                precio_unitario: item.precioUnitario,
              })),
            },
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
              },
            },
            usuario: {
              select: {
                id_usuario: true,
                nombre: true,
              },
            },
          },
        });
      }

      return { ventaId: venta.id_venta, pedido: pedidoCreado };
    });

    const venta = await this.findOne(transactionResult.ventaId.toString());

    if (transactionResult.pedido) {
      return {
        ...venta,
        pedido: transactionResult.pedido,
      };
    }

    return venta;
  }
  // --- FIN DE LA MODIFICACIÓN ---

  findAll(query: FindSalesQueryDto) {
    // ... (sin cambios)
    const where: Prisma.ventaWhereInput = {};
    if (query.id_negocio) {
      where.id_negocio = this.toBigInt(query.id_negocio, 'id_negocio');
    }
    if (query.id_usuario) {
      where.id_usuario = this.toBigInt(query.id_usuario, 'id_usuario');
    }
    if (query.estado) {
      where.estado = query.estado;
    }
    if (query.desde || query.hasta) {
      where.fecha_venta = {};
      if (query.desde) {
        where.fecha_venta.gte = query.desde;
      }
      if (query.hasta) {
        where.fecha_venta.lte = query.hasta;
      }
    }
    return this.prisma.venta.findMany({
      where,
      orderBy: { id_venta: 'desc' },
      include: this.saleIncludes(),
    });
  }

  async findOne(id: string) {
    // ... (sin cambios)
    const ventaId = this.toBigInt(id, 'id');
    const venta = await this.prisma.venta.findUnique({
      where: { id_venta: ventaId },
      include: this.saleIncludes(),
    });
    if (!venta) {
      throw new NotFoundException('Venta no encontrada');
    }
    return venta;
  }

  async close(id: string, dto: CloseSaleDto) {
    // ... (sin cambios)
    const ventaId = this.toBigInt(id, 'id');
    const tipoPagoId = this.toBigInt(dto.id_tipo_pago);
    await this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id_venta: ventaId },
        select: { estado: true },
      });
      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }
      if (venta.estado === 'pagada') {
        throw new BadRequestException('La venta ya está cerrada');
      }
      if (venta.estado === 'cancelada') {
        throw new BadRequestException('No es posible cerrar una venta cancelada');
      }
      const tieneItems = await tx.detalle_venta.count({ where: { id_venta: ventaId } });
      if (tieneItems === 0) {
        throw new BadRequestException('No es posible cerrar la venta sin productos');
      }
      await tx.venta.update({
        where: { id_venta: ventaId },
        data: {
          estado: 'pagada',
          fecha_venta: new Date(),
          id_tipo_pago: tipoPagoId,
        },
      });
    });
    return this.findOne(id);
  }

  async cancel(id: string) {
    // ... (sin cambios)
    const ventaId = this.toBigInt(id, 'id');
    await this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id_venta: ventaId },
        select: { estado: true },
      });
      if (!venta) {
        throw new NotFoundException('Venta no encontrada');
      }
      if (venta.estado === 'cancelada') {
        return;
      }
      await tx.detalle_venta.deleteMany({ where: { id_venta: ventaId } });
      await tx.venta.update({
        where: { id_venta: ventaId },
        data: { estado: 'cancelada', fecha_venta: null },
      });
    });
    return this.findOne(id);
  }

  async cashoutSummary(query: CashoutSummaryQueryDto, _currentUser: { id_usuario: bigint }) {
    const negocioId = this.toBigInt(query.id_negocio, 'id_negocio');
    if (!negocioId) {
      throw new BadRequestException('Debe proporcionar un negocio válido');
    }

    const includeRecent = query.incluir_recientes ?? true;

    const snapshot = await this.buildCashoutSnapshot(this.prisma, negocioId, {
      fechaInicio: query.fecha_inicio,
      fechaFin: query.fecha_fin,
      limite: includeRecent ? query.limite_recientes : 0,
      forceStartOfDay: query.todo_el_dia ?? false,
    });

    const summary = this.formatCashoutSnapshot(snapshot, {
      initialCash: snapshot.ultimoCorte?.monto_final ?? null,
    });

    if (!includeRecent) {
      summary.recentSales = [];
    }

    return summary;
  }

  async createCashout(dto: CreateCashoutDto, currentUser: { id_usuario: bigint }) {
    const negocioId = this.toBigInt(dto.id_negocio, 'id_negocio');
    if (!negocioId) {
      throw new BadRequestException('Debe proporcionar un negocio válido');
    }

    const usuarioId = currentUser?.id_usuario;

    return this.prisma.$transaction(async (tx) => {
      const snapshot = await this.buildCashoutSnapshot(tx, negocioId, {
        fechaInicio: dto.fecha_inicio,
        fechaFin: dto.fecha_fin,
        limite: 15,
        forceStartOfDay: dto.todo_el_dia ?? true,
        ignoreLastBoundary: dto.todo_el_dia ?? true,
      });

      const montoInicial = dto.monto_inicial !== undefined
        ? new Prisma.Decimal(dto.monto_inicial)
        : snapshot.sugerenciaInicio ?? null;

      const montoFinal = dto.monto_final !== undefined
        ? new Prisma.Decimal(dto.monto_final)
        : null;

      const cashout = await tx.corte_caja.create({
        data: {
          id_negocio: negocioId,
          id_usuario: usuarioId ?? undefined,
          fecha_inicio: snapshot.range.desde,
          fecha_fin: snapshot.range.hasta,
          monto_inicial: montoInicial ?? undefined,
          monto_final: montoFinal ?? undefined,
          ventas_totales: snapshot.totalTickets,
        },
      });

      const formatted = this.formatCashoutSnapshot(
        {
          ...snapshot,
          ultimoCorte: cashout,
          sugerenciaInicio: cashout.monto_final ?? snapshot.sugerenciaInicio ?? null,
        },
        {
          declaredCash: montoFinal,
          initialCash: montoInicial,
          overrideLast: cashout,
        },
      );

      return {
        cashout,
        resumen: formatted,
      };
    });
  }

  async cashoutHistory(query: CashoutHistoryQueryDto, _currentUser: { id_usuario: bigint }) {
    const negocioId = this.toBigInt(query.id_negocio, 'id_negocio');
    if (!negocioId) {
      throw new BadRequestException('Debe proporcionar un negocio válido');
    }

    const where: Prisma.corte_cajaWhereInput = {
      id_negocio: negocioId,
    };

    if (query.fecha_inicio || query.fecha_fin) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (query.fecha_inicio) {
        dateFilter.gte = query.fecha_inicio;
      }
      if (query.fecha_fin) {
        dateFilter.lte = query.fecha_fin;
      }
      if (Object.keys(dateFilter).length > 0) {
        where.fecha_fin = dateFilter;
      }
    }

    const limite = Math.min(Math.max(query.limite ?? 10, 1), 30);
    const includeRecent = query.incluir_recientes ?? false;
    const recientesLimite = includeRecent ? Math.min(Math.max(query.limite_recientes ?? 5, 1), 20) : 0;

    const cortes = await this.prisma.corte_caja.findMany({
      where,
      orderBy: { fecha_fin: 'desc' },
      take: limite,
    });

    if (cortes.length === 0) {
      return {
        businessId: negocioId.toString(),
        items: [],
      };
    }

    const enriched = await Promise.all(
      cortes.map(async (corte) => {
        const snapshot = await this.buildCashoutSnapshot(this.prisma, negocioId, {
          fechaInicio: corte.fecha_inicio ?? undefined,
          fechaFin: corte.fecha_fin ?? undefined,
          limite: recientesLimite,
          presetLastCashout: corte,
          ignoreLastBoundary: true,
        });

        const formatted = this.formatCashoutSnapshot(snapshot, {
          declaredCash: corte.monto_final,
          initialCash: corte.monto_inicial,
          overrideLast: corte,
        });

        return {
          id: corte.id_corte.toString(),
          startedAt: formatted.range.from,
          finishedAt: formatted.range.to,
          totals: formatted.totals,
          opening: formatted.opening,
          paymentBreakdown: formatted.paymentBreakdown,
          recentSales: includeRecent ? formatted.recentSales : [],
          recordedBy: corte.id_usuario ? corte.id_usuario.toString() : null,
        };
      }),
    );

    return {
      businessId: negocioId.toString(),
      items: enriched,
    };
  }

  // --- MODIFICADO ---
  // prepareItems ahora DEVUELVE el tipo 'NormalizedItem' completo (con precio)
  private async prepareItems(
    tx: Prisma.TransactionClient, 
    negocioId: bigint, 
    items: Omit<NormalizedItem, 'precioUnitario'>[]
  ): Promise<NormalizedItem[]> {
  // --- FIN MODIFICACIÓN ---
    if (items.length === 0) {
      return [];
    }
  
    const ids = items.map((item) => item.idProducto);
  
    const [productos, inventarios, negocioOverrides] = await Promise.all([
      tx.producto.findMany({
        where: { id_producto: { in: ids } },
        select: { id_producto: true, nombre: true, precio: true, estado: true },
      }),
      tx.inventario.findMany({
        where: {
          id_negocio: negocioId,
          id_producto: { in: ids },
        },
        select: { id_producto: true, cantidad_actual: true },
      }),
      (tx as any).negocio_producto.findMany({ where: { id_negocio: negocioId, id_producto: { in: ids } }, select: { id_producto: true, precio: true, activo: true } }),
    ]);
  
    const productosMap = new Map<string, (typeof productos)[number]>(
      productos.map((p) => [p.id_producto?.toString() ?? '', p]),
    );
    const inventarioMap = new Map<string, (typeof inventarios)[number]>(
      inventarios.map((inv) => [inv.id_producto?.toString() ?? '', inv]),
    );
    const overrideRecords = (negocioOverrides ?? []) as Array<{
      id_producto: bigint | null;
      precio: Prisma.Decimal | number | null;
      activo: boolean | null;
    }>;
    const overrideMap = new Map<string, (typeof overrideRecords)[number]>(
      overrideRecords.map((ov) => [ov.id_producto?.toString() ?? '', ov]),
    );
  
    return items.map((item) => {
      const key = item.idProducto.toString();
      const producto = productosMap.get(key);
      if (!producto) {
        throw new NotFoundException(`Producto ${item.idProducto.toString()} no encontrado`);
      }
  
      if (producto.estado && producto.estado !== 'activo') {
        throw new BadRequestException(`El producto ${producto.nombre} no está disponible para la venta`);
      }

      const override = overrideMap.get(key);
      if (override) {
        if (override.activo === false) {
          throw new BadRequestException(`El producto ${producto.nombre} está desactivado en este negocio`);
        }
      }
  
      const inventario = inventarioMap.get(key);
      if (!inventario) {
        throw new BadRequestException(
          `No existe inventario registrado para ${producto.nombre} en el negocio ${negocioId.toString()}. Configura stock antes de vender este producto.`,
        );
      }

      const disponible = Number(inventario.cantidad_actual ?? 0);
      if (disponible < item.cantidad) {
        throw new BadRequestException(`Stock insuficiente para ${producto.nombre}. Disponible: ${disponible}`);
      }
      
      // --- MODIFICADO ---
      // Usamos SIEMPRE el precio de la base de datos
      const precioBase = override && override.precio !== undefined ? Number(override.precio) : Number(producto.precio);
      if (Number.isNaN(precioBase)) {
        throw new BadRequestException(`Precio inválido para el producto ${producto.nombre}`);
      }
  
      return {
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        precioUnitario: new Prisma.Decimal(precioBase), // <-- Devolvemos el precio
      };
      // --- FIN MODIFICACIÓN ---
    });
  }
  
  // --- MODIFICADO ---
  // normalizeItems ahora solo agrupa IDs y cantidades.
  // El precio se determinará en 'prepareItems' desde la BD.
  private normalizeItems(items: SaleItemDto[]): Omit<NormalizedItem, 'precioUnitario'>[] {
    const map = new Map<string, Omit<NormalizedItem, 'precioUnitario'>>();
  
    for (const item of items) {
      const idProducto = this.toBigInt(item.id_producto, 'id_producto');
      const key = idProducto.toString();
      const existente = map.get(key) ?? { idProducto, cantidad: 0 };
      existente.cantidad += item.cantidad;
      // Ya no guardamos el precioUnitario del DTO, usaremos el de la BD
      map.set(key, existente);
    }
  
    return Array.from(map.values());
  }
  // --- FIN MODIFICACIÓN ---

  private async buildCashoutSnapshot(
    client: PrismaClientLike,
    negocioId: bigint,
    options: {
      fechaInicio?: Date;
      fechaFin?: Date;
      limite?: number;
      forceStartOfDay?: boolean;
      presetLastCashout?: corte_caja | null;
      ignoreLastBoundary?: boolean;
    } = {},
  ): Promise<CashoutSnapshot> {
    const limite = Math.min(Math.max(options.limite ?? 10, 0), 50);
    const fechaFin = options.fechaFin ? new Date(options.fechaFin) : new Date();
    if (Number.isNaN(fechaFin.getTime())) {
      throw new BadRequestException('Fecha de corte inválida');
    }

    const ultimoCorte =
      options.presetLastCashout !== undefined
        ? options.presetLastCashout
        : await client.corte_caja.findFirst({
            where: { id_negocio: negocioId },
            orderBy: { fecha_fin: 'desc' },
          });

    let fechaInicio: Date | null = null;
    if (options.fechaInicio) {
      const parsed = new Date(options.fechaInicio);
      if (!Number.isNaN(parsed.getTime())) {
        fechaInicio = parsed;
      }
    }
    if (options.forceStartOfDay) {
      const startOfDay = new Date(fechaFin);
      startOfDay.setHours(0, 0, 0, 0);
      if (!fechaInicio || fechaInicio < startOfDay) {
        fechaInicio = startOfDay;
      }
    }
    if (!options.ignoreLastBoundary && !options.forceStartOfDay && ultimoCorte?.fecha_fin) {
      const corteFin = new Date(ultimoCorte.fecha_fin);
      if (!fechaInicio || fechaInicio < corteFin) {
        fechaInicio = corteFin;
      }
    }
    if (!fechaInicio) {
      const startOfDay = new Date(fechaFin);
      startOfDay.setHours(0, 0, 0, 0);
      fechaInicio = startOfDay;
    }
    if (fechaInicio > fechaFin) {
      const adjusted = new Date(fechaFin);
      adjusted.setHours(0, 0, 0, 0);
      fechaInicio = adjusted;
    }

    const ventas = await client.venta.findMany({
      where: {
        id_negocio: negocioId,
        estado: 'pagada',
        fecha_venta: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      select: {
        id_venta: true,
        fecha_venta: true,
        total: true,
        id_tipo_pago: true,
        tipo_pago: {
          select: {
            tipo: true,
          },
        },
        detalle_venta: {
          select: {
            cantidad: true,
            precio_unitario: true,
          },
        },
      },
      orderBy: { fecha_venta: 'desc' },
    });

    const metricas = ventas.map((venta) => {
      const totalDecimal = venta.total !== null && venta.total !== undefined
        ? new Prisma.Decimal(venta.total)
        : venta.detalle_venta.reduce((acc, detalle) => {
            const cantidad = Number(detalle.cantidad ?? 0);
            if (!cantidad) {
              return acc;
            }
            const precio = new Prisma.Decimal(detalle.precio_unitario ?? 0);
            return acc.plus(precio.times(cantidad));
          }, new Prisma.Decimal(0));
      return { venta, total: totalDecimal };
    });

    let totalVentas = new Prisma.Decimal(0);
    const bucketMap = new Map<string, CashoutPaymentBucket>();

    for (const { venta, total } of metricas) {
      totalVentas = totalVentas.plus(total);
      const key = venta.id_tipo_pago ? venta.id_tipo_pago.toString() : 'sin_tipo';
      const label = venta.tipo_pago?.tipo?.trim() || 'Sin tipo';
      const bucket = bucketMap.get(key) ?? {
        idTipoPago: venta.id_tipo_pago ?? null,
        label,
        total: new Prisma.Decimal(0),
        tickets: 0,
      };
      bucket.label = label;
      bucket.total = bucket.total.plus(total);
      bucket.tickets += 1;
      bucketMap.set(key, bucket);
    }

    const recientes = metricas.slice(0, limite).map(({ venta, total }) => ({
      idVenta: venta.id_venta,
      fecha: venta.fecha_venta ?? null,
      total,
      paymentLabel: venta.tipo_pago?.tipo?.trim() || 'Sin tipo',
    }));

    return {
      negocioId,
      range: { desde: fechaInicio, hasta: fechaFin },
      totalVentas,
      totalTickets: metricas.length,
      buckets: Array.from(bucketMap.values()),
      recientes,
      ultimoCorte,
      sugerenciaInicio: ultimoCorte?.monto_final ?? null,
    };
  }

  private formatCashoutSnapshot(snapshot: CashoutSnapshot, extras: {
    declaredCash?: number | string | Prisma.Decimal | null;
    initialCash?: number | string | Prisma.Decimal | null;
    overrideLast?: corte_caja | null;
  } = {}) {
    const declaredDecimal = this.coerceDecimal(extras.declaredCash);
    const initialDecimal = this.coerceDecimal(extras.initialCash);
    const lastRecord = extras.overrideLast ?? snapshot.ultimoCorte ?? null;
    const efectivoBucket = snapshot.buckets.find((bucket) => /efectivo|cash|contado/i.test(bucket.label));
    const esperadoDecimal = efectivoBucket ? new Prisma.Decimal(efectivoBucket.total) : null;
    const diferenciaDecimal = declaredDecimal && esperadoDecimal ? declaredDecimal.minus(esperadoDecimal) : null;

    return {
      businessId: snapshot.negocioId.toString(),
      range: {
        from: snapshot.range.desde.toISOString(),
        to: snapshot.range.hasta.toISOString(),
      },
      totals: {
        salesCount: snapshot.totalTickets,
        salesAmount: this.decimalToNumber(snapshot.totalVentas),
        expectedCash: this.decimalToNumber(esperadoDecimal),
        declaredCash: this.decimalToNumber(declaredDecimal),
        difference: this.decimalToNumber(diferenciaDecimal),
      },
      opening: {
        suggested: this.decimalToNumber(snapshot.sugerenciaInicio ?? null),
        declared: this.decimalToNumber(initialDecimal),
      },
      paymentBreakdown: snapshot.buckets.map((bucket) => ({
        id_tipo_pago: bucket.idTipoPago ? bucket.idTipoPago.toString() : null,
        label: bucket.label,
        total: this.decimalToNumber(bucket.total),
        tickets: bucket.tickets,
      })),
      recentSales: snapshot.recientes.map((venta) => ({
        id: venta.idVenta.toString(),
        timestamp: venta.fecha ? venta.fecha.toISOString() : null,
        total: this.decimalToNumber(venta.total),
        paymentLabel: venta.paymentLabel,
      })),
      lastCashout: lastRecord
        ? {
            id: lastRecord.id_corte.toString(),
            startedAt: lastRecord.fecha_inicio ? lastRecord.fecha_inicio.toISOString() : null,
            finishedAt: lastRecord.fecha_fin ? lastRecord.fecha_fin.toISOString() : null,
            initialAmount: this.decimalToNumber(this.coerceDecimal(lastRecord.monto_inicial)),
            finalAmount: this.decimalToNumber(this.coerceDecimal(lastRecord.monto_final)),
            salesCount: lastRecord.ventas_totales ?? null,
          }
        : null,
    };
  }

  private coerceDecimal(value?: number | string | Prisma.Decimal | null): Prisma.Decimal | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (value instanceof Prisma.Decimal) {
      return new Prisma.Decimal(value);
    }
    if (typeof value === 'string' && value.trim() === '') {
      return null;
    }
    return new Prisma.Decimal(value);
  }

  private decimalToNumber(value?: Prisma.Decimal | null): number | null {
    if (!value) {
      return null;
    }
    return Number(value.toFixed(2));
  }

  private toBigInt(value?: string | number | bigint | null, field?: string): bigint | undefined {
    // ... (sin cambios)
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    try {
      return typeof value === 'bigint' ? value : BigInt(value);
    } catch (error) {
      throw new BadRequestException(`Valor inválido para ${field ?? 'identificador'}`);
    }
  }

  private saleIncludes(): Prisma.ventaInclude {
    // ... (sin cambios)
    return {
      detalle_venta: {
        include: {
          producto: {
            select: {
              nombre: true,
              precio: true,
              codigo_barras: true,
            },
          },
        },
      },
      tipo_pago: {
        select: {
          id_tipo_pago: true,
          tipo: true,
        },
      },
      usuarios: {
        select: {
          id_usuario: true,
          nombre: true,
        },
      },
    };
  }
}