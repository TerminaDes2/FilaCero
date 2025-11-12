'use client';
import React from 'react';
import { KitchenBoard } from '../../../src/components/pos/kitchen/KitchenBoard';
import { useKitchenBoard } from '../../../src/state/kitchenBoardStore';
import { OnboardingEmptyState } from '../../../src/components/pos/kitchen/OnboardingEmptyState';

export default function KitchenPage() {
  const { tickets } = useKitchenBoard();

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Cocina · Comandas</h1>
        <p className="text-sm text-gray-600">Tablero en tiempo real para el equipo de cocina.</p>
      </div>
      {tickets.length === 0 ? (
        <OnboardingEmptyState />
      ) : (
        <KitchenBoard />
      )}
    </div>
  );
}
