import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import {
  UpdatePedidoDto,
  UpdateEstadoPedidoDto,
  EstadoPedido,
} from './dto/update-pedido.dto';

@Injectable()
export class PedidosService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private normalizeId(id: string | number | bigint): bigint {
    if (typeof id === 'bigint') {
      return id;
    }
    if (typeof id === 'number') {
      if (!Number.isFinite(id)) {
        throw new BadRequestException('ID de pedido inválido');
      }
      return BigInt(Math.trunc(id));
    }
    const trimmed = id.trim();
    if (!/^[0-9]+$/.test(trimmed)) {
      throw new BadRequestException('ID de pedido inválido');
    }
    try {
      return BigInt(trimmed);
    } catch {
      throw new BadRequestException('ID de pedido inválido');
    }
  }

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

      // Notificar nuevo pedido al POS
      try {
        await this.notificationsService.notifyNewOrder(pedido);
      } catch (notifError) {
        // No lanzar error si falla la notificación para no bloquear la creación del pedido
        console.error('Error enviando notificación de nuevo pedido:', notifError);
      }

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
  async findOne(id: string | number | bigint) {
    const pedidoId = this.normalizeId(id);
    const pedido = await this.prisma.pedido.findUnique({
      where: { id_pedido: pedidoId },
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
  async update(id: string | number | bigint, updatePedidoDto: UpdatePedidoDto) {
    const pedidoId = this.normalizeId(id);
    // Verificar que existe
    await this.findOne(pedidoId);

    try {
      const pedidoActualizado = await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
        data: updatePedidoDto,
        include: {
          detalle_pedido: {
            include: {
              producto: true,
            },
          },
          negocio: true,
          usuario: {
            select: {
              id_usuario: true,
              nombre: true,
              correo_electronico: true,
              numero_telefono: true,
            },
          },
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
   * IMPORTANTE: Incluye validación de ownership del negocio
   */
  async updateEstado(
    id: string | number | bigint,
    updateEstadoDto: UpdateEstadoPedidoDto,
    userContext?: { id_usuario: number; id_negocio?: number; rol?: string },
  ) {
    const pedidoId = this.normalizeId(id);
    // Verificar que existe
    const pedidoActual = await this.findOne(pedidoId);

    const estadoAnterior = pedidoActual.data.estado;
    const nuevoEstado = updateEstadoDto.estado;

    // VALIDACIÓN DE OWNERSHIP (crítico para seguridad)
    if (userContext) {
      const pedidoIdNegocio = Number(pedidoActual.data.id_negocio);
      const userIdNegocio = userContext.id_negocio;

      // Verificar que el usuario pertenece al negocio del pedido
      if (userIdNegocio && userIdNegocio !== pedidoIdNegocio) {
        throw new ForbiddenException(
          `No tienes permiso para modificar pedidos del negocio ${pedidoIdNegocio}. ` +
            `Tu negocio es ${userIdNegocio}.`,
        );
      }

      // Si no tiene id_negocio en el token, verificar que es owner del negocio
      if (!userIdNegocio && userContext.rol !== 'superadmin') {
        // Verificar ownership mediante consulta a BD
        const negocio = await this.prisma.negocio.findFirst({
          where: {
            id_negocio: pedidoActual.data.id_negocio,
            owner_id: BigInt(userContext.id_usuario),
          },
        });

        if (!negocio) {
          throw new ForbiddenException(
            `No tienes permiso para modificar pedidos de este negocio.`,
          );
        }
      }
    }

    // Si el estado es el mismo, no hacer nada
    if (estadoAnterior === nuevoEstado) {
      return {
        success: true,
        message: `Pedido ya está en estado: ${nuevoEstado}`,
        data: pedidoActual.data,
        estado_anterior: estadoAnterior,
      };
    }

    // Validar transiciones de estado permitidas
    this.validarTransicionEstado(estadoAnterior, nuevoEstado);

    try {
      // Actualizar estado (los triggers de DB manejarán inventario automáticamente)
      const pedidoActualizado = await this.prisma.pedido.update({
        where: { id_pedido: pedidoId },
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
          usuario: {
            select: {
              id_usuario: true,
              nombre: true,
              correo_electronico: true,
              numero_telefono: true,
            },
          },
        },
      });

      // Notificar cambio de estado al cliente
      try {
        await this.notificationsService.notifyOrderStatusChange(
          pedidoActualizado,
          nuevoEstado,
        );
      } catch (notifError) {
        // No lanzar error si falla la notificación
        console.error('Error enviando notificación de cambio de estado:', notifError);
      }

      // Si el pedido llega a estado final, cerrar sala WebSocket
      if (nuevoEstado === 'entregado' || nuevoEstado === 'cancelado') {
        try {
          const gateway = this.notificationsService['gateway'];
          if (gateway && typeof gateway.closeOrderRoom === 'function') {
            gateway.closeOrderRoom(Number(pedidoId));
          }
        } catch (closeError) {
          console.error('Error cerrando sala de pedido:', closeError);
        }
      }

      return {
        success: true,
        message: `Pedido actualizado a estado: ${nuevoEstado}`,
        data: pedidoActualizado,
        estado_anterior: estadoAnterior,
      };
    } catch (error) {
      // Si el error es de stock insuficiente (del trigger), retornarlo amigable
      const errorMessage = error.message || String(error);
      
      // Extraer mensaje limpio de stock insuficiente
      if (errorMessage.includes('Stock insuficiente')) {
        const match = errorMessage.match(/Stock insuficiente para producto (\d+): disponible (\d+) < requerido (\d+)/);
        if (match) {
          const [, productoId, disponible, requerido] = match;
          throw new BadRequestException(
            `No hay suficiente stock para completar el pedido. Producto ${productoId}: disponible ${disponible}, necesario ${requerido}`,
          );
        }
        throw new BadRequestException('Stock insuficiente para completar el pedido');
      }
      
      throw new InternalServerErrorException(
        'Error al actualizar el estado: ' + errorMessage,
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
      pendiente: ['confirmado', 'en_preparacion', 'cancelado'], // Permitir saltar confirmado
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
