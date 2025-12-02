import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductPriceHistoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Actualiza el precio de un producto creando un registro histórico
   * @param idProducto - ID del producto
   * @param nuevoPrecio - Nuevo precio a aplicar
   * @param idUsuario - ID del usuario que realiza el cambio
   * @param motivo - Razón del cambio (opcional pero recomendado)
   */
  async actualizarPrecio(
    idProducto: bigint,
    nuevoPrecio: number,
    idUsuario: bigint,
    motivo?: string,
  ): Promise<void> {
    // Validar que el precio sea positivo
    if (nuevoPrecio <= 0) {
      throw new BadRequestException('El precio debe ser un valor positivo');
    }

    // Obtener el producto actual para validar y comparar
    const productoActual = await this.prisma.producto.findUnique({
      where: { id_producto: idProducto },
      select: { precio: true },
    });

    if (!productoActual) {
      throw new BadRequestException(`Producto con ID ${idProducto} no encontrado`);
    }

    const precioAnterior = Number(productoActual.precio);
    const cambioAbsoluto = Math.abs(precioAnterior - nuevoPrecio);
    const cambioPorcentaje = precioAnterior > 0 ? (cambioAbsoluto / precioAnterior) * 100 : 0;

    // Validar motivo obligatorio para cambios significativos (>10%)
    if (cambioPorcentaje > 10 && !motivo) {
      throw new BadRequestException(
        `Cambios de precio mayores al 10% (${cambioPorcentaje.toFixed(1)}%) requieren un motivo`,
      );
    }

    // Ejecutar actualización en transacción
    await this.prisma.$transaction(async (tx) => {
      // 1. Cerrar el precio anterior (marcar como no vigente)
      await tx.productoHistorialPrecio.updateMany({
        where: {
          id_producto: idProducto,
          vigente: true,
        },
        data: {
          vigente: false,
          fecha_fin: new Date(),
        },
      });

      // 2. Crear nuevo registro histórico
      await tx.productoHistorialPrecio.create({
        data: {
          id_producto: idProducto,
          precio: new Prisma.Decimal(nuevoPrecio),
          fecha_inicio: new Date(),
          vigente: true,
          motivo: motivo || null,
          id_usuario: idUsuario,
        },
      });

      // 3. Actualizar precio actual en la tabla producto
      await tx.producto.update({
        where: { id_producto: idProducto },
        data: { precio: new Prisma.Decimal(nuevoPrecio) },
      });
    });
  }

  /**
   * Obtiene el historial completo de precios de un producto
   * @param idProducto - ID del producto
   * @returns Array de registros históricos ordenados por fecha descendente
   */
  async obtenerHistorial(idProducto: bigint) {
    const historial = await this.prisma.productoHistorialPrecio.findMany({
      where: { id_producto: idProducto },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            nombre: true,
            correo_electronico: true,
          },
        },
      },
      orderBy: { fecha_inicio: 'desc' },
    });

    return historial.map((registro) => ({
      id_historial: registro.id_historial.toString(),
      precio: Number(registro.precio),
      fecha_inicio: registro.fecha_inicio.toISOString(),
      fecha_fin: registro.fecha_fin?.toISOString() || null,
      vigente: registro.vigente,
      motivo: registro.motivo,
      usuario: registro.usuario
        ? {
            id: registro.usuario.id_usuario.toString(),
            nombre: registro.usuario.nombre,
            correo: registro.usuario.correo_electronico,
          }
        : null,
      creado_en: registro.creado_en.toISOString(),
    }));
  }

  /**
   * Obtiene el precio vigente actual de un producto
   * @param idProducto - ID del producto
   * @returns Registro de precio actual o null si no existe
   */
  async obtenerPrecioActual(idProducto: bigint) {
    const precioActual = await this.prisma.productoHistorialPrecio.findFirst({
      where: {
        id_producto: idProducto,
        vigente: true,
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            correo_electronico: true,
          },
        },
      },
    });

    if (!precioActual) {
      return null;
    }

    return {
      id_historial: precioActual.id_historial.toString(),
      precio: Number(precioActual.precio),
      fecha_inicio: precioActual.fecha_inicio.toISOString(),
      vigente: precioActual.vigente,
      motivo: precioActual.motivo,
      usuario: precioActual.usuario
        ? {
            nombre: precioActual.usuario.nombre,
            correo: precioActual.usuario.correo_electronico,
          }
        : null,
      creado_en: precioActual.creado_en.toISOString(),
    };
  }

  /**
   * Obtiene el precio de un producto en una fecha específica
   * @param idProducto - ID del producto
   * @param fecha - Fecha de consulta
   * @returns Precio vigente en esa fecha o null
   */
  async obtenerPrecioEnFecha(idProducto: bigint, fecha: Date) {
    const precioEnFecha = await this.prisma.productoHistorialPrecio.findFirst({
      where: {
        id_producto: idProducto,
        fecha_inicio: { lte: fecha },
        OR: [{ fecha_fin: { gte: fecha } }, { fecha_fin: null }],
      },
      orderBy: { fecha_inicio: 'desc' },
    });

    if (!precioEnFecha) {
      return null;
    }

    return {
      precio: Number(precioEnFecha.precio),
      fecha_inicio: precioEnFecha.fecha_inicio.toISOString(),
      fecha_fin: precioEnFecha.fecha_fin?.toISOString() || null,
      vigente: precioEnFecha.vigente,
    };
  }

  /**
   * Obtiene estadísticas de cambios de precio para un producto
   * @param idProducto - ID del producto
   * @returns Estadísticas de cambios
   */
  async obtenerEstadisticas(idProducto: bigint) {
    const historial = await this.prisma.productoHistorialPrecio.findMany({
      where: { id_producto: idProducto },
      orderBy: { fecha_inicio: 'asc' },
      select: {
        precio: true,
        fecha_inicio: true,
      },
    });

    if (historial.length === 0) {
      return {
        total_cambios: 0,
        precio_minimo: null,
        precio_maximo: null,
        precio_promedio: null,
        primer_precio: null,
        ultimo_precio: null,
      };
    }

    const precios = historial.map((h) => Number(h.precio));
    const precioMinimo = Math.min(...precios);
    const precioMaximo = Math.max(...precios);
    const precioPromedio = precios.reduce((a, b) => a + b, 0) / precios.length;

    return {
      total_cambios: historial.length,
      precio_minimo: precioMinimo,
      precio_maximo: precioMaximo,
      precio_promedio: Number(precioPromedio.toFixed(2)),
      primer_precio: Number(historial[0].precio),
      ultimo_precio: Number(historial[historial.length - 1].precio),
      primera_fecha: historial[0].fecha_inicio.toISOString(),
      ultima_fecha: historial[historial.length - 1].fecha_inicio.toISOString(),
    };
  }
}
