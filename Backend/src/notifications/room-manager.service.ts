import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

interface RoomInfo {
  roomId: string;
  type: 'business' | 'order';
  createdAt: Date;
  markedForCleanup: boolean;
  cleanupAt?: Date;
  clientCount: number;
}

@Injectable()
export class RoomManagerService {
  private readonly logger = new Logger(RoomManagerService.name);
  private rooms: Map<string, RoomInfo> = new Map();

  /**
   * Registra una nueva sala
   */
  registerRoom(roomId: string, type: 'business' | 'order', clientCount: number = 1): void {
    const existing = this.rooms.get(roomId);
    
    if (existing) {
      existing.clientCount = clientCount;
      this.logger.debug(`Room ${roomId} updated with ${clientCount} clients`);
    } else {
      this.rooms.set(roomId, {
        roomId,
        type,
        createdAt: new Date(),
        markedForCleanup: false,
        clientCount,
      });
      this.logger.log(`Room ${roomId} registered (type: ${type}, clients: ${clientCount})`);
    }
  }

  /**
   * Actualiza el número de clientes en una sala
   */
  updateClientCount(roomId: string, clientCount: number): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.clientCount = clientCount;
      this.logger.debug(`Room ${roomId} now has ${clientCount} clients`);
    }
  }

  /**
   * Cierra una sala inmediatamente (cuando el pedido alcanza estado final)
   */
  closeRoomImmediately(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      this.logger.warn(`Attempted to close non-existent room: ${roomId}`);
      return false;
    }

    this.rooms.delete(roomId);
    this.logger.log(`Room ${roomId} closed immediately (type: ${room.type})`);
    return true;
  }

  /**
   * Limpia salas huérfanas (sin clientes conectados) cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  cleanupOrphanRooms(): void {
    const before = this.rooms.size;
    const orphans: string[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.clientCount === 0) {
        orphans.push(roomId);
      }
    }

    orphans.forEach(roomId => {
      this.rooms.delete(roomId);
    });

    if (orphans.length > 0) {
      this.logger.log(
        `Cleaned up ${orphans.length} orphan rooms (total rooms: ${before} → ${this.rooms.size})`
      );
    }
  }

  /**
   * Retorna estadísticas de salas activas
   */
  getRoomStats(): {
    totalRooms: number;
    businessRooms: number;
    orderRooms: number;
    orphanRooms: number;
    rooms: Array<{
      roomId: string;
      type: string;
      clientCount: number;
      ageMinutes: number;
    }>;
  } {
    const stats = {
      totalRooms: this.rooms.size,
      businessRooms: 0,
      orderRooms: 0,
      orphanRooms: 0,
      rooms: [] as Array<{
        roomId: string;
        type: string;
        clientCount: number;
        ageMinutes: number;
      }>,
    };

    const now = new Date();

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.type === 'business') stats.businessRooms++;
      if (room.type === 'order') stats.orderRooms++;
      if (room.clientCount === 0) stats.orphanRooms++;

      const ageMs = now.getTime() - room.createdAt.getTime();
      stats.rooms.push({
        roomId,
        type: room.type,
        clientCount: room.clientCount,
        ageMinutes: Math.floor(ageMs / 60000),
      });
    }

    return stats;
  }

  /**
   * Verifica si una sala existe
   */
  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }
}
