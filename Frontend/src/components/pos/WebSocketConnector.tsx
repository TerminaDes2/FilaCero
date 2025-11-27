"use client";

import { useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useKitchenBoard } from '@/state/kitchenBoardStore';
import { activeBusiness } from '@/lib/api';
import type { EventEnvelope } from '@/lib/websocket';

/**
 * Componente que conecta WebSocket con el KitchenBoard Store
 * Maneja la conexión automática, suscripción a eventos y actualización del store
 */
export function WebSocketConnector() {
    const { subscribe, joinRoom, isConnected, stats } = useWebSocket({
        autoConnect: true,
    });

    const {
        addOrUpdateTicket,
        setWsConnected,
        setWsReconnectionAttempts,
        handleMaxReconnections,
    } = useKitchenBoard();

    // Actualizar estado de conexión en el store
    useEffect(() => {
        setWsConnected(isConnected);
    }, [isConnected, setWsConnected]);

    // Actualizar intentos de reconexión en el store
    useEffect(() => {
        setWsReconnectionAttempts(stats.reconnectionAttempts);
    }, [stats.reconnectionAttempts, setWsReconnectionAttempts]);

    // Unirse a la sala del negocio activo
    useEffect(() => {
        const businessId = activeBusiness.get();
        if (isConnected && businessId) {
            const businessIdNum = parseInt(businessId, 10);
            if (!isNaN(businessIdNum)) {
                joinRoom('business', businessIdNum);
                console.log(`[WebSocketConnector] Joined business room ${businessId}`);
            }
        }
    }, [isConnected, joinRoom]);

    // Suscribirse a eventos de pedidos
    useEffect(() => {
        // Evento: Nuevo pedido creado
        const unsubscribeCreated = subscribe('order.created', (event: EventEnvelope) => {
            console.log('[WebSocketConnector] order.created:', event);
            addOrUpdateTicket(event);

            // Reproducir sonido si está activado
            const { filters } = useKitchenBoard.getState();
            if (filters.soundOn) {
                playNotificationSound();
            }
        });

        // Evento: Estado del pedido cambió
        const unsubscribeStatusChanged = subscribe('order.status.changed', (event: EventEnvelope) => {
            console.log('[WebSocketConnector] order.status.changed:', event);
            addOrUpdateTicket(event);
        });

        // Evento: Sala cerrándose
        const unsubscribeRoomClosing = subscribe('room.closing', (event: EventEnvelope) => {
            console.log('[WebSocketConnector] room.closing:', event);
            // La sala se cierra, el cliente se desconectará
        });

        // Evento: Máximo de reconexiones alcanzado
        const unsubscribeMaxReconnections = subscribe('max-reconnections-reached', (event: EventEnvelope) => {
            console.error('[WebSocketConnector] max-reconnections-reached:', event);
            handleMaxReconnections();
        });

        // Cleanup: desuscribirse al desmontar
        return () => {
            unsubscribeCreated();
            unsubscribeStatusChanged();
            unsubscribeRoomClosing();
            unsubscribeMaxReconnections();
        };
    }, [subscribe, addOrUpdateTicket, handleMaxReconnections]);

    // Este componente no renderiza nada visible
    return null;
}

/**
 * Reproduce un sonido de notificación
 */
function playNotificationSound() {
    try {
        // Usar API de Audio nativa del navegador
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch((error) => {
            console.warn('[WebSocketConnector] Could not play notification sound:', error);
        });
    } catch (error) {
        console.warn('[WebSocketConnector] Error creating audio:', error);
    }
}
