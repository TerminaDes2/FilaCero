// Backend/src/metrics/metrics.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  // Helper para convertir a BigInt
  private toBigInt(value: string): bigint {
    try {
      return BigInt(value);
    } catch {
      throw new BadRequestException('ID de negocio inválido');
    }
  }

  async getDashboardData(negocioId: string, from: Date, to: Date) {
    const idNegocioBigInt = this.toBigInt(negocioId);

    // Definir el rango de fechas y el ID del negocio
    const whereClause: Prisma.ventaWhereInput = {
      id_negocio: idNegocioBigInt,
      estado: 'pagada', // Solo contamos ventas pagadas
      fecha_venta: {
        gte: from, // Mayor o igual que 'from'
        lte: to,   // Menor o igual que 'to'
      },
    };

    // 1. Calcular Ingresos, Tickets, y Promedio (KPIs principales)
    const kpis = await this.prisma.venta.aggregate({
      _sum: {
        total: true, // Suma de la columna 'total' (Ingresos)
      },
      _count: {
        id_venta: true, // Conteo de filas (Tickets)
      },
      _avg: {
        total: true, // Promedio de la columna 'total' (Ticket Promedio)
      },
      where: whereClause,
    });

    // 2. Calcular Artículos Vendidos
    const articlesSold = await this.prisma.detalle_venta.aggregate({
      _sum: {
        cantidad: true, // Suma de la columna 'cantidad'
      },
      where: {
        venta: whereClause, // Filtra los detalles que pertenecen a las ventas
      },
    });

    // 3. Calcular Ventas por Categoría (Top Categoría)
    const categorySales = await this.prisma.detalle_venta.groupBy({
      by: ['id_producto'], // Agrupamos por producto primero
      _sum: {
        cantidad: true,
      },
      where: {
        venta: whereClause,
      },
      orderBy: {
        _sum: {
          cantidad: 'desc',
        },
      },
      take: 50, // Tomamos los 50 productos más vendidos
    });

    // Necesitamos buscar la categoría de esos productos
    const productIds = categorySales.map(p => p.id_producto);
    const productsWithCategory = await this.prisma.producto.findMany({
      where: {
        id_producto: { in: productIds },
      },
      select: {
        id_producto: true,
        categoria: {
          select: {
            nombre: true,
          },
        },
      },
    });
    
    // Mapeamos producto a categoría
    const prodToCatMap = new Map(
      productsWithCategory.map(p => [
        p.id_producto.toString(), 
        p.categoria?.nombre ?? 'Otros'
      ])
    );
    
    // Ahora sí, sumamos por categoría
    const topCategoriesMap = new Map<string, number>();
    for (const item of categorySales) {
      const categoryName = prodToCatMap.get(item.id_producto.toString()) || 'Otros';
      const currentCount = topCategoriesMap.get(categoryName) || 0;
      topCategoriesMap.set(categoryName, currentCount + (item._sum.cantidad || 0));
    }
    
    // Convertimos el Map a un Array y ordenamos
    const topCategories = Array.from(topCategoriesMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);


    // 4. Formatear la respuesta
    const ingresos = kpis._sum.total ?? 0;
    const tickets = kpis._count.id_venta ?? 0;
    const ticketPromedio = kpis._avg.total ?? 0;
    const articulosVendidos = articlesSold._sum.cantidad ?? 0;

    return {
      kpis: {
        ingresos: Number(ingresos),
        tickets: tickets,
        ticketPromedio: Number(ticketPromedio),
        articulosVendidos: articulosVendidos,
      },
      topCategories, // ej: [{ name: 'Bebidas', count: 42 }, { name: 'Otros', count: 10 }]
      // Aquí puedes añadir 'traficoPorHora', 'rankingRapido', etc.
    };
  }
}