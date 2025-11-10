import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import {
  UpdatePedidoDto,
  UpdateEstadoPedidoDto,
  EstadoPedido,
} from './dto/update-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crear un nuevo pedido con sus items
   */
  async create(createPedidoDto: CreatePedidoDto) {
    const { items, ...pedidoData } = createPedidoDto;

    // Validar que tenga al menos usuario o email
    if (!pedidoData.id_usuario && !pedidoData.email_cliente) {
      throw new BadRequestException(
        'El pedido debe tener un id_usuario o un email_cliente',
      );
    }

    try {
      // Crear pedido con items en una transacción
      const pedido = await this.prisma.$transaction(async (tx) => {
        // 1. Crear el pedido (total en 0, se recalculará con trigger)
        const nuevoPedido = await tx.pedido.create({
          data: {
            ...pedidoData,
            total: 0,
            estado: 'pendiente',
          },
        });

        // 2. Crear los items del pedido
        await tx.detalle_pedido.createMany({
          data: items.map((item) => ({
            id_pedido: nuevoPedido.id_pedido,
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            notas: item.notas,
          })),
        });

        // 3. Obtener el pedido completo con items (el total ya está recalculado por trigger)
        return tx.pedido.findUnique({
          where: { id_pedido: nuevoPedido.id_pedido },
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
                correo_electronico: true,
              },
            },
            tipo_pago: {
              select: {
                id_tipo_pago: true,
                tipo: true,
              },
            },
          },
        });
      });

      return {
        success: true,
        message: 'Pedido creado exitosamente',
        data: pedido,
      };
    } catch (error) {
      console.error('Error creando pedido:', error);
      throw new InternalServerErrorException(
        'Error al crear el pedido: ' + error.message,
      );
    }
  }

  /**
   * Obtener todos los pedidos con filtros opcionales
   */
  async findAll(filters?: {
    id_negocio?: number;
    id_usuario?: number;
    estado?: string;
    fecha_desde?: Date;
    fecha_hasta?: Date;
  }) {
    const where: any = {};

    if (filters?.id_negocio) where.id_negocio = filters.id_negocio;
    if (filters?.id_usuario) where.id_usuario = filters.id_usuario;
    if (filters?.estado) where.estado = filters.estado;
    if (filters?.fecha_desde || filters?.fecha_hasta) {
      where.fecha_creacion = {};
      if (filters.fecha_desde) where.fecha_creacion.gte = filters.fecha_desde;
      if (filters.fecha_hasta) where.fecha_creacion.lte = filters.fecha_hasta;
    }

    const pedidos = await this.prisma.pedido.findMany({
      where,
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
            correo_electronico: true,
          },
        },
      },
      orderBy: {
        fecha_creacion: 'desc',
      },
    });

    return {
      success: true,
      data: pedidos,
      total: pedidos.length,
    };
  }

  /**
   * Obtener un pedido por ID
   */
  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: id },
      include: {
        detalle_pedido: {
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre: true,
                descripcion: true,
                precio: true,
              },
            },
          },
        },
        negocio: {
          select: {
            id_negocio: true,
            nombre: true,
            direccion: true,
            telefono: true,
          },
        },
        usuario: {
          select: {
            id_usuario: true,
            nombre: true,
            correo_electronico: true,
            numero_telefono: true,
          },
        },
        tipo_pago: {
          select: {
            id_tipo_pago: true,
            tipo: true,
          },
        },
        notificaciones: {
          select: {
            id_notificacion: true,
            tipo: true,
            titulo: true,
            mensaje: true,
            leida: true,
            creado_en: true,
          },
          orderBy: {
            creado_en: 'desc',
          },
        },
      },
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return {
      success: true,
      data: pedido,
    };
  }

  /**
   * Actualizar información del pedido (no el estado)
   */
  async update(id: number, updatePedidoDto: UpdatePedidoDto) {
    // Verificar que existe
    await this.findOne(id);

    try {
      const pedidoActualizado = await this.prisma.pedido.update({
        where: { id_pedido: id },
        data: updatePedidoDto,
        include: {
          detalle_pedido: {
            include: {
              producto: true,
            },
          },
          negocio: true,
          usuario: true,
        },
      });

      return {
        success: true,
        message: 'Pedido actualizado exitosamente',
        data: pedidoActualizado,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al actualizar el pedido: ' + error.message,
      );
    }
  }

  /**
   * Actualizar el estado del pedido (con lógica de triggers)
   */
  async updateEstado(id: number, updateEstadoDto: UpdateEstadoPedidoDto) {
    // Verificar que existe
    const pedidoActual = await this.findOne(id);

    const estadoAnterior = pedidoActual.data.estado;
    const nuevoEstado = updateEstadoDto.estado;

    // Validar transiciones de estado permitidas
    this.validarTransicionEstado(estadoAnterior, nuevoEstado);

    try {
      // Actualizar estado (los triggers de DB manejarán inventario automáticamente)
      const pedidoActualizado = await this.prisma.pedido.update({
        where: { id_pedido: id },
        data: {
          estado: nuevoEstado,
        },
        include: {
          detalle_pedido: {
            include: {
              producto: true,
            },
          },
          negocio: true,
          usuario: true,
        },
      });

      return {
        success: true,
        message: `Pedido actualizado a estado: ${nuevoEstado}`,
        data: pedidoActualizado,
        estado_anterior: estadoAnterior,
      };
    } catch (error) {
      // Si el error es de stock insuficiente (del trigger), retornarlo amigable
      if (error.message?.includes('Stock insuficiente')) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(
        'Error al actualizar el estado: ' + error.message,
      );
    }
  }

  /**
   * Obtener pedidos por estado para vista Kanban
   */
  async getPedidosPorEstado(id_negocio: number) {
    const estados = Object.values(EstadoPedido);
    const pedidosPorEstado: Record<string, any[]> = {};

    for (const estado of estados) {
      const pedidos = await this.prisma.pedido.findMany({
        where: {
          id_negocio,
          estado,
        },
        include: {
          detalle_pedido: {
            include: {
              producto: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: {
          fecha_creacion: 'asc',
        },
      });

      pedidosPorEstado[estado] = pedidos;
    }

    return {
      success: true,
      data: pedidosPorEstado,
    };
  }

  /**
   * Validar transiciones de estado permitidas
   */
  private validarTransicionEstado(estadoActual: string, nuevoEstado: string) {
    const transicionesPermitidas: Record<string, string[]> = {
      pendiente: ['confirmado', 'cancelado'],
      confirmado: ['en_preparacion', 'cancelado'],
      en_preparacion: ['listo', 'cancelado'],
      listo: ['entregado'],
      entregado: [], // Estado final
      cancelado: [], // Estado final
    };

    const permitidas = transicionesPermitidas[estadoActual] || [];

    if (!permitidas.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de "${estadoActual}" a "${nuevoEstado}". ` +
          `Transiciones permitidas: ${permitidas.join(', ') || 'ninguna'}`,
      );
    }
  }
}
