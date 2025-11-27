"use client";

import { useKitchenBoard } from '@/state/kitchenBoardStore';

/**
 * Banner que se muestra cuando se alcanza el límite de reconexiones
 */
export function ReconnectionBanner() {
    const { showReconnectionBanner, dismissReconnectionBanner } = useKitchenBoard();

    if (!showReconnectionBanner) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <div>
                        <p className="font-semibold">Conexión perdida</p>
                        <p className="text-sm opacity-90">
                            No se pudo restablecer la conexión. Por favor recarga la página para continuar.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
                    >
                        Recargar página
                    </button>
                    <button
                        onClick={dismissReconnectionBanner}
                        className="text-white hover:bg-red-700 p-2 rounded-lg transition-colors"
                        aria-label="Cerrar"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
