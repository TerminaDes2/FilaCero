import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException, UseGuards, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoomManagerService } from './room-manager.service';
import { NotificationsService } from './notifications.service';

interface EventEnvelope {
  eventId: string;
  type: string;
  timestamp: number;
  payload: any;
}

interface JwtPayload {
  id_usuario: number;
  id_negocio?: number;
  correo_electronico: string;
  rol: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly MAX_RECONNECTIONS = 12;
  private clientReconnections: Map<string, number> = new Map();
  private degradedMode = false; // Circuit breaker para BD

  constructor(
    private readonly jwtService: JwtService,
    private readonly roomManager: RoomManagerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Establece la referencia del gateway en el servicio después de la inicialización
   */
  onModuleInit(): void {
    this.notificationsService.setGateway(this);
    this.logger.log('NotificationsGateway initialized and linked to NotificationsService');
  }

  /**
   * Maneja nueva conexión con autenticación JWT
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      // Extraer token JWT del handshake
      const token = this.extractToken(client);
      
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Validar token JWT
      let payload: JwtPayload;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.emit('error', { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      // Guardar payload en el socket para uso posterior
      client.data.user = payload;
      client.data.reconnectionCount = this.clientReconnections.get(client.id) || 0;

      // Verificar límite de reconexiones
      if (client.data.reconnectionCount >= this.MAX_RECONNECTIONS) {
        this.logger.warn(
          `Max reconnections reached for client ${client.id} (${client.data.reconnectionCount})`,
        );
        client.emit('max-reconnections-reached', {
          message: 'Maximum reconnection attempts reached. Please refresh the page.',
        });
        client.disconnect();
        return;
      }

      // Incrementar contador de reconexiones
      if (client.data.reconnectionCount > 0) {
        this.logger.log(
          `Client ${client.id} reconnected (attempt ${client.data.reconnectionCount}/${this.MAX_RECONNECTIONS})`,
        );
      }

      this.logger.log(
        `Client connected: ${client.id} (user: ${payload.id_usuario}, business: ${payload.id_negocio || 'N/A'}`,
      );

      // Resetear contador en conexión exitosa
      this.clientReconnections.set(client.id, 0);

      // Emitir evento de conexión exitosa
      client.emit('connected', {
        message: 'Connected to notification server',
        reconnectionCount: client.data.reconnectionCount,
      });
    } catch (error) {
      this.logger.error(`Error handling connection:`, error);
      client.emit('error', { message: 'Connection error' });
      client.disconnect();
    }
  }

  /**
   * Maneja desconexión de cliente
   */
  handleDisconnect(client: Socket): void {
    const user = client.data.user as JwtPayload;
    
    // Actualizar contadores de salas
    const rooms = Array.from(client.rooms).filter(room => room !== client.id);
    rooms.forEach(room => {
      const clientsInRoom = this.server.sockets.adapter.rooms.get(room)?.size || 0;
      this.roomManager.updateClientCount(room, clientsInRoom);
    });

    // Incrementar contador de reconexiones para este cliente
    const currentCount = this.clientReconnections.get(client.id) || 0;
    this.clientReconnections.set(client.id, currentCount + 1);

    this.logger.log(
      `Client disconnected: ${client.id} (user: ${user?.id_usuario || 'unknown'})`,
    );

    // Limpiar contador después de 1 minuto si no se reconecta
    setTimeout(() => {
      this.clientReconnections.delete(client.id);
    }, 60000);
  }

  /**
   * Cliente se une a sala de negocio (para POS)
   */
  @SubscribeMessage('join-business-room')
  async handleJoinBusinessRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id_negocio: number },
  ): Promise<void> {
    const user = client.data.user as JwtPayload;

    // Verificar autorización: el usuario debe pertenecer al negocio
    if (!user.id_negocio || user.id_negocio !== data.id_negocio) {
      this.logger.warn(
        `Unauthorized: User ${user.id_usuario} attempted to join business ${data.id_negocio}`,
      );
      client.emit('error', { message: 'Unauthorized to join this business room' });
      return;
    }

    const roomId = `business-${data.id_negocio}`;
    await client.join(roomId);
    
    const clientsInRoom = this.server.sockets.adapter.rooms.get(roomId)?.size || 0;
    this.roomManager.registerRoom(roomId, 'business', clientsInRoom);

    this.logger.log(
      `Client ${client.id} joined business room ${roomId} (${clientsInRoom} clients)`,
    );
    
    client.emit('joined-room', { room: roomId, type: 'business' });
  }

  /**
   * Cliente se une a sala de pedido (para clientes)
   */
  @SubscribeMessage('join-order-room')
  async handleJoinOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id_pedido: number },
  ): Promise<void> {
    const user = client.data.user as JwtPayload;

    // TODO: Verificar que el pedido pertenece al usuario
    // Por ahora permitimos que cualquier usuario autenticado se una

    const roomId = `order-${data.id_pedido}`;
    await client.join(roomId);
    
    const clientsInRoom = this.server.sockets.adapter.rooms.get(roomId)?.size || 0;
    this.roomManager.registerRoom(roomId, 'order', clientsInRoom);

    this.logger.log(
      `Client ${client.id} joined order room ${roomId} (${clientsInRoom} clients)`,
    );
    
    client.emit('joined-room', { room: roomId, type: 'order' });
  }

  /**
   * Emite evento de nuevo pedido al POS del negocio
   */
  emitNewOrder(id_negocio: number, event: EventEnvelope): void {
    const roomId = `business-${id_negocio}`;
    
    if (this.degradedMode) {
      this.logger.warn(`Degraded mode: Cannot emit to room ${roomId}`);
      return;
    }

    this.server.to(roomId).emit('order.created', event);
    this.logger.debug(`Emitted order.created to room ${roomId} (eventId: ${event.eventId})`);
  }

  /**
   * Emite evento de cambio de estado al cliente del pedido
   */
  emitOrderStatusChange(id_pedido: number, event: EventEnvelope): void {
    const roomId = `order-${id_pedido}`;
    
    if (this.degradedMode) {
      this.logger.warn(`Degraded mode: Cannot emit to room ${roomId}`);
      return;
    }

    this.server.to(roomId).emit('order.status.changed', event);
    this.logger.debug(
      `Emitted order.status.changed to room ${roomId} (eventId: ${event.eventId})`,
    );
  }

  /**
   * Cierra sala de pedido y notifica a clientes
   */
  closeOrderRoom(id_pedido: number): void {
    const roomId = `order-${id_pedido}`;
    
    // Emitir evento de cierre a todos los clientes en la sala
    this.server.to(roomId).emit('room.closing', {
      eventId: Date.now().toString(),
      type: 'room.closing',
      timestamp: Date.now(),
      payload: { id_pedido, reason: 'Order completed or cancelled' },
    });

    // Desconectar todos los clientes de la sala
    this.server.in(roomId).socketsLeave(roomId);
    
    // Eliminar sala del manager
    this.roomManager.closeRoomImmediately(roomId);
    
    this.logger.log(`Order room  ${roomId} closed`);
  }

  /**
   * Extrae token JWT del handshake
   */
  private extractToken(client: Socket): string | null {
    // Primero intentar desde auth header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Intentar desde query params
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    return token as string || null;
  }

  /**
   * Activa modo degradado (circuit breaker para BD)
   */
  setDegradedMode(enabled: boolean): void {
    this.degradedMode = enabled;
    this.logger.warn(`Degraded mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Obtiene estadísticas del gateway
   */
  getStats() {
    const connectedClients = this.server.sockets.sockets.size;
    const roomStats = this.roomManager.getRoomStats();
    
    return {
      connectedClients,
      degradedMode: this.degradedMode,
      ...roomStats,
    };
  }
}
