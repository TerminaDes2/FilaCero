"use client";
import React from 'react';
import { useKitchenBoard } from '../../../state/kitchenBoardStore';
import { useTranslation } from '../../../hooks/useTranslation';

export const OnboardingEmptyState: React.FC = () => {
  const { addMockTicket } = useKitchenBoard();
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center bg-white/60">
      <h3 className="text-lg font-semibold mb-2">{t('pos.kitchen.board.onboarding.title')}</h3>
      <p className="text-sm text-gray-600 mb-4">
        {t('pos.kitchen.board.onboarding.subtitle')}
      </p>
      <div className="flex items-center justify-center gap-2">
        <button onClick={addMockTicket} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
          {t('pos.kitchen.board.onboarding.simulate')}
        </button>
      </div>
    </div>
  );
};
