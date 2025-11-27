import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PedidosService } from '../pedidos/pedidos.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService, private pedidosService: PedidosService) {}

  async create(data: CreateInventoryDto) {
    const prisma = this.prisma as any;
    try {
      return await prisma.inventario.create({
        data: {
          id_negocio: data.id_negocio ? BigInt(data.id_negocio) : undefined,
          id_producto: data.id_producto ? BigInt(data.id_producto) : undefined,
          stock_minimo: data.stock_minimo,
          cantidad_actual: data.cantidad_actual,
          fecha_actualizacion: data.fecha_actualizacion ? new Date(data.fecha_actualizacion) : undefined,
        },
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003: FK constraint failed
        if (e.code === 'P2003') {
          throw new BadRequestException('Violación de clave foránea: id_producto o id_negocio no existe');
        }
      }
      throw e;
    }
  }

  findAll(query?: { limit?: string; offset?: string; id_producto?: string; id_negocio?: string }) {
    const prisma = this.prisma as any;
    const take = query?.limit ? Number(query.limit) : undefined;
    const skip = query?.offset ? Number(query.offset) : undefined;
    const where: any = {};
    if (query?.id_producto) where.id_producto = BigInt(query.id_producto);
    if (query?.id_negocio) where.id_negocio = BigInt(query.id_negocio);
    return prisma.inventario.findMany({ where, orderBy: { id_inventario: 'desc' }, take, skip });
  }

  async findOne(id: string) {
    const prisma = this.prisma as any;
    const item = await prisma.inventario.findUnique({ where: { id_inventario: BigInt(id) } });
    if (!item) throw new NotFoundException('Inventario no encontrado');
    return item;
  }

  async update(id: string, data: UpdateInventoryDto) {
    const prisma = this.prisma as any;
    // leer inventario actual antes de actualizar
    const existing = await prisma.inventario.findUnique({ where: { id_inventario: BigInt(id) } });
    try {
      const updated = await prisma.inventario.update({
        where: { id_inventario: BigInt(id) },
        data: {
          id_negocio: data.id_negocio ? BigInt(data.id_negocio) : undefined,
          id_producto: data.id_producto ? BigInt(data.id_producto) : undefined,
          stock_minimo: data.stock_minimo,
          cantidad_actual: data.cantidad_actual,
          fecha_actualizacion: data.fecha_actualizacion ? new Date(data.fecha_actualizacion) : undefined,
        },
      });
      // Si la cantidad actual pasa de >0 a <=0, cancelar pedidos que dependen del producto
      try {
        const oldQty = Number(existing?.cantidad_actual ?? 0);
        const newQty = Number(updated?.cantidad_actual ?? 0);
        if (oldQty > 0 && newQty <= 0 && updated.id_producto) {
          await this.pedidosService.cancelPedidosContainingProduct(BigInt(updated.id_producto), 'stock_insuficiente');
        }
      } catch (e) {
        // registrar pero no bloquear la respuesta
        console.error('Error procesando auto-cancelación por stock:', e);
      }
      return updated;
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2003') {
          throw new BadRequestException('Violación de clave foránea: id_producto o id_negocio no existe');
        }
        if (e.code === 'P2025') {
          throw new NotFoundException('Inventario no encontrado');
        }
      }
      throw e;
    }
  }

  async remove(id: string) {
    const prisma = this.prisma as any;
    try {
      await prisma.inventario.delete({ where: { id_inventario: BigInt(id) } });
      return { deleted: true };
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Inventario no encontrado');
      }
      throw e;
    }
  }
}
