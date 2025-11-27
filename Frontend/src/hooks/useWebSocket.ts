import { useEffect, useState, useCallback, useRef } from 'react';
import type { EventEnvelope, EventCallback } from '@/lib/websocket';

// Lazy-load del cliente WebSocket
let getWebSocketClient: (() => any) | null = null;

const loadWebSocketClient = async () => {
  if (!getWebSocketClient) {
    const module = await import('@/lib/websocket');
    getWebSocketClient = module.getWebSocketClient;
  }
  return getWebSocketClient!();
};

interface UseWebSocketOptions {
  autoConnect?: boolean;
  url?: string;
}

interface WebSocketStats {
  connected: boolean;
  reconnectionAttempts: number;
  processedEvents: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = false, url } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<WebSocketStats>({
    connected: false,
    reconnectionAttempts: 0,
    processedEvents: 0,
  });
  const clientRef = useRef<any>(null);
  const callbacksRef = useRef<Map<string, EventCallback>>(new Map());

  /**
   * Conecta al WebSocket
   */
  const connect = useCallback(async () => {
    try {
      if (!clientRef.current) {
        clientRef.current = await loadWebSocketClient();
      }
      
      await clientRef.current.connect(url);
      setIsConnected(true);
      
      // Actualizar stats periódicamente
      const statsInterval = setInterval(() => {
        if (clientRef.current) {
          setStats(clientRef.current.getStats());
        }
      }, 5000);

      return () => clearInterval(statsInterval);
    } catch (error) {
      console.error('[useWebSocket] Error connecting:', error);
      setIsConnected(false);
    }
  }, [url]);

  /**
   * Desconecta del WebSocket
   */
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  /**
   * Suscribe a un evento
   */
  const subscribe = useCallback((eventType: string, callback: EventCallback) => {
    if (!clientRef.current) {
      console.warn('[useWebSocket] Cannot subscribe, client not initialized');
      return () => {};
    }

    // Envolver callback para actualizar estado de conexión
    const wrappedCallback: EventCallback = (event) => {
      callback(event);
      setStats(clientRef.current.getStats());
    };

    callbacksRef.current.set(eventType, wrappedCallback);
    clientRef.current.on(eventType, wrappedCallback);

    // Retornar función de limpieza
    return () => {
      if (clientRef.current) {
        const cb = callbacksRef.current.get(eventType);
        if (cb) {
          clientRef.current.off(eventType, cb);
          callbacksRef.current.delete(eventType);
        }
      }
    };
  }, []);

  /**
   * Se une a una sala
   */
  const joinRoom = useCallback((roomType: 'business' | 'order', id: number) => {
    if (!clientRef.current) {
      console.warn('[useWebSocket] Cannot join room, client not initialized');
      return;
    }

    clientRef.current.joinRoom(roomType, id);
  }, []);

  /**
   * Auto-conectar si está habilitado
   */
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (autoConnect) {
      connect().then(cleanupFn => {
        cleanup = cleanupFn;
      });
    }

    return () => {
      // Limpiar callbacks al desmontar
      callbacksRef.current.forEach((callback, eventType) => {
        if (clientRef.current) {
          clientRef.current.off(eventType, callback);
        }
      });
      callbacksRef.current.clear();

      // Limpiar interval de stats
      if (cleanup) {
        cleanup();
      }

      // NO desconectar aquí para mantener la conexión compartida
      // El cliente es singleton y se reutiliza entre componentes
    };
  }, [autoConnect, connect]);

  return {
    isConnected,
    stats,
    connect,
    disconnect,
    subscribe,
    joinRoom,
  };
}
