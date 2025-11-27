"use client";

import { useKitchenBoard } from '@/state/kitchenBoardStore';

/**
 * Indicador visual del estado de conexión WebSocket
 */
export function ConnectionIndicator() {
    const { wsConnected, wsReconnectionAttempts } = useKitchenBoard();

    return (
        <div className="flex items-center gap-2">
            {/* Indicador de estado */}
            <div className="flex items-center gap-1.5">
                <div
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${wsConnected
                            ? 'bg-green-500 animate-pulse'
                            : wsReconnectionAttempts > 0
                                ? 'bg-yellow-500 animate-pulse'
                                : 'bg-gray-400'
                        }`}
                />
                <span className="text-sm font-medium text-gray-700">
                    {wsConnected
                        ? 'Conectado'
                        : wsReconnectionAttempts > 0
                            ? `Reconectando (${wsReconnectionAttempts}/12)...`
                            : 'Desconectado'}
                </span>
            </div>

            {/* Tooltip con información adicional */}
            {wsConnected && (
                <div className="group relative">
                    <svg
                        className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg">
                        <p className="font-medium mb-1">Conexión en tiempo real activa</p>
                        <p className="text-gray-300">
                            Los pedidos nuevos y cambios de estado se actualizarán automáticamente sin necesidad de recargar.
                        </p>
                        <div className="absolute top-full right-4 -mt-1">
                            <div className="border-4 border-transparent border-t-gray-900" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
