"use client";
import React from 'react';
import { useKitchenBoard } from '../../../state/kitchenBoardStore';

export const OnboardingEmptyState: React.FC = () => {
  const { addMockTicket } = useKitchenBoard();
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center bg-white/60">
      <h3 className="text-lg font-semibold mb-2">Panel de Cocina</h3>
      <p className="text-sm text-gray-600 mb-4">
        Aquí verás las comandas nuevas, en preparación, listas y entregadas. Arranca creando un pedido de ejemplo.
      </p>
      <div className="flex items-center justify-center gap-2">
        <button onClick={addMockTicket} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
          Simular pedido
        </button>
      </div>
    </div>
  );
};
