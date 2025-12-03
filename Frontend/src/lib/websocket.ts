import { io, Socket } from 'socket.io-client';

interface EventEnvelope {
  eventId: string;
  type: string;
  timestamp: number;
  payload: any;
}

type EventCallback = (event: EventEnvelope) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectionAttempts = 0;
  private readonly MAX_RECONNECTIONS = 12;
  private reconnectionTimer: NodeJS.Timeout | null = null;
  private eventCallbacks: Map<string, Set<EventCallback>> = new Map();
  private processedEventIds: Set<string> = new Set();
  private readonly MAX_CACHE_SIZE = 100;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;

  /**
   * Obtiene un access token válido, renovándolo si es necesario
   */
  private async getValidAccessToken(): Promise<string | null> {
    try {
      // Intentar obtener el token del localStorage/estado de autenticación
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.warn('[WebSocket] No access token found');
        return null;
      }

      // Decodificar el token para verificar expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convertir a ms
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      // Si expira en menos de 5 minutos, renovar usando refresh token
      if (expiresAt - now < fiveMinutes) {
        console.log('[WebSocket] Access token expiring soon, refreshing...');
        
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include', // Envía cookies httpOnly (refresh token)
        });

        if (response.ok) {
          const data = await response.json();
          const newToken = data.access_token || data.accessToken;
          
          if (newToken) {
            localStorage.setItem('access_token', newToken);
            console.log('[WebSocket] Access token refreshed successfully');
            return newToken;
          }
        } else {
          console.error('[WebSocket] Refresh token failed, redirecting to login');
          // Redirigir a login si el refresh falla
          window.location.href = '/login';
          return null;
        }
      }

      return token;
    } catch (error) {
      console.error('[WebSocket] Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Conecta al servidor WebSocket con autenticación JWT
   */
  async connect(url: string = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'): Promise<void> {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    const token = await this.getValidAccessToken();
    
    if (!token) {
      console.error('[WebSocket] Cannot connect without valid token');
      return;
    }

    this.isManualDisconnect = false;

    this.socket = io(`${url}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: this.MAX_RECONNECTIONS,
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  /**
   * Configura los manejadores de eventos del socket
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.reconnectionAttempts = 0;
      this.clearReconnectionTimer();
    });

    this.socket.on('disconnect', (reason: Socket.DisconnectReason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.stopHeartbeat();

      if (!this.isManualDisconnect) {
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', async (error: Error) => {
      console.error('[WebSocket] Connection error:', error);
      
      // Si el error es de autenticación, intentar renovar token
      if (error.message?.includes('Invalid') || error.message?.includes('expired')) {
        const newToken = await this.getValidAccessToken();
        if (newToken && this.socket) {
          this.socket.auth = { token: newToken };
        }
      }
    });

    this.socket.on('error', (error: Error) => {
      console.error('[WebSocket] Socket error:', error);
    });

    this.socket.on('max-reconnections-reached', () => {
      console.error('[WebSocket] Max reconnections reached, stopping...');
      this.handleMaxReconnections();
    });

    this.socket.on('connected', (data: any) => {
      console.log('[WebSocket] Server confirmed connection:', data);
    });

    this.socket.on('joined-room', (data: any) => {
      console.log('[WebSocket] Joined room:', data);
    });

    // Escuchar eventos estandarizados
    this.socket.on('order.created', (event: EventEnvelope) => {
      this.processEvent('order.created', event);
    });

    this.socket.on('order.status.changed', (event: EventEnvelope) => {
      this.processEvent('order.status.changed', event);
    });

    this.socket.on('room.closing', (event: EventEnvelope) => {
      this.processEvent('room.closing', event);
      console.log('[WebSocket] Room closing, disconnecting...');
      this.disconnect();
    });
  }

  /**
   * Procesa un evento con deduplicación
   */
  private processEvent(type: string, event: EventEnvelope): void {
    // Validar estructura del evento
    if (!event || !event.eventId || !event.type || !event.timestamp || !event.payload) {
      console.warn('[WebSocket] Invalid event structure, discarding:', event);
      return;
    }

    // Deduplicación: verificar si ya procesamos este eventId
    if (this.processedEventIds.has(event.eventId)) {
      console.log(`[WebSocket] Event ${event.eventId} already processed, skipping`);
      return;
    }

    // Agregar a cache de eventos procesados
    this.processedEventIds.add(event.eventId);

    // Mantener cache bajo control (últimos 100)
    if (this.processedEventIds.size > this.MAX_CACHE_SIZE) {
      const firstItem = this.processedEventIds.values().next().value;
      this.processedEventIds.delete(firstItem);
    }

    console.log(`[WebSocket] Processing event ${type}:`, event.eventId);

    // Notificar a los callbacks suscritos
    const callbacks = this.eventCallbacks.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[WebSocket] Error in callback for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Maneja la reconexión con backoff exponencial
   */
  private handleReconnection(): void {
    if (this.reconnectionAttempts >= this.MAX_RECONNECTIONS) {
      this.handleMaxReconnections();
      return;
    }

    this.reconnectionAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectionAttempts - 1), 30000);
    
    console.log(
      `[WebSocket] Reconnection attempt ${this.reconnectionAttempts}/${this.MAX_RECONNECTIONS} in ${delay}ms`
    );

    this.reconnectionTimer = setTimeout(async () => {
      // Renovar token antes de reconectar
      const token = await this.getValidAccessToken();
      if (token && this.socket) {
        this.socket.auth = { token };
        this.socket.connect();
      }
    }, delay);
  }

  /**
   * Maneja el caso de alcanzar el límite de reconexiones
   */
  private handleMaxReconnections(): void {
    console.error('[WebSocket] Maximum reconnection attempts reached');
    
    // Emitir evento especial para que la UI muestre mensaje
    this.processEvent('max-reconnections-reached', {
      eventId: `max-reconnect-${Date.now()}`,
      type: 'max-reconnections-reached',
      timestamp: Date.now(),
      payload: {
        message: 'Conexión perdida. Por favor recarga la página.',
        attempts: this.reconnectionAttempts,
      },
    });

    this.disconnect();
  }

  /**
   * Limpia el timer de reconexión
   */
  private clearReconnectionTimer(): void {
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
  }

  /**
   * Inicia heartbeat para detectar conexiones muertas
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 25000); // Cada 25 segundos
  }

  /**
   * Detiene heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Suscribe un callback a un tipo de evento
   */
  on(eventType: string, callback: EventCallback): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, new Set());
    }
    this.eventCallbacks.get(eventType)!.add(callback);
  }

  /**
   * Desuscribe un callback de un tipo de evento
   */
  off(eventType: string, callback: EventCallback): void {
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Se une a una sala específica
   */
  joinRoom(roomType: 'business' | 'order', id: number): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot join room, not connected');
      return;
    }

    const eventName = roomType === 'business' ? 'join-business-room' : 'join-order-room';
    const data = roomType === 'business' ? { id_negocio: id } : { id_pedido: id };

    this.socket.emit(eventName, data);
    console.log(`[WebSocket] Joining ${roomType} room ${id}`);
  }

  /**
   * Desconecta del servidor
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.clearReconnectionTimer();
    this.stopHeartbeat();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    console.log('[WebSocket] Manually disconnected');
  }

  /**
   * Obtiene estadísticas de conexión
   */
  getStats(): {
    connected: boolean;
    reconnectionAttempts: number;
    processedEvents: number;
  } {
    return {
      connected: this.socket?.connected || false,
      reconnectionAttempts: this.reconnectionAttempts,
      processedEvents: this.processedEventIds.size,
    };
  }
}

// Exportar instancia singleton
let websocketInstance: WebSocketClient | null = null;

export const getWebSocketClient = (): WebSocketClient => {
  if (!websocketInstance) {
    websocketInstance = new WebSocketClient();
  }
  return websocketInstance;
};

export type { EventEnvelope, EventCallback };
