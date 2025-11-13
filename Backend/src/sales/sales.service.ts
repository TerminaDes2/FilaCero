// Backend/src/sales/sales.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CloseSaleDto } from './dto/close-sale.dto';
import { FindSalesQueryDto } from './dto/find-sales.query';
import { SaleItemDto } from './dto/sale-item.dto';

// --- MODIFICADO ---
// La salida de prepareItems (itemsListos) tendrá un Decimal
interface NormalizedItem {
  idProducto: bigint;
  cantidad: number;
  precioUnitario: Prisma.Decimal; // <-- Tipo corregido
}
// --- FIN MODIFICACIÓN ---

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

    const ventaId = await this.prisma.$transaction(async (tx) => {
      
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
        const detalleVenta = await tx.detalle_venta.create({
          data: {
            id_venta: venta.id_venta,
            id_producto: item.idProducto,
            cantidad: item.cantidad,
            precio_unitario: item.precioUnitario,
          },
        });

        // Descontar el stock
        await tx.inventario.updateMany({
          where: {
            id_negocio: negocioId,
            id_producto: item.idProducto,
          },
          data: {
            cantidad_actual: {
              decrement: item.cantidad,
            },
          },
        });

        // Registrar el movimiento
        await tx.movimientos_inventario.create({
          data: {
            id_negocio: negocioId,
            id_producto: item.idProducto,
            delta: -item.cantidad,
            motivo: 'venta',
            id_venta: venta.id_venta,
            id_detalle: detalleVenta.id_detalle,
            id_usuario: usuarioId,
          },
        });
      }

      // 6. Lógica de 'abierta'
      if (!cerrar) {
        await tx.venta.update({
          where: { id_venta: venta.id_venta },
          data: { estado: 'abierta', fecha_venta: null },
        });
      }

      return venta.id_venta;
    });

    return this.findOne(ventaId.toString());
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
  
    const [productos, inventarios] = await Promise.all([
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
    ]);
  
    const productosMap = new Map(productos.map((p) => [p.id_producto, p]));
    const inventarioMap = new Map(inventarios.map((inv) => [inv.id_producto, inv]));
  
    return items.map((item) => {
      const producto = productosMap.get(item.idProducto);
      if (!producto) {
        throw new NotFoundException(`Producto ${item.idProducto.toString()} no encontrado`);
      }
  
      if (producto.estado && producto.estado !== 'activo') {
        throw new BadRequestException(`El producto ${producto.nombre} no está disponible para la venta`);
      }
  
      const inventario = inventarioMap.get(item.idProducto);
      if (!inventario) {
        throw new BadRequestException(`El producto ${producto.nombre} no tiene inventario asociado al negocio seleccionado`);
      }
  
      const disponible = Number(inventario.cantidad_actual ?? 0);
      if (disponible < item.cantidad) {
        throw new BadRequestException(`Stock insuficiente para ${producto.nombre}. Disponible: ${disponible}`);
      }
      
      // --- MODIFICADO ---
      // Usamos SIEMPRE el precio de la base de datos
      const precioBase = Number(producto.precio); 
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