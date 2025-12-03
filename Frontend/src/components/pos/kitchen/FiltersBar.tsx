"use client";
import React, { useEffect } from 'react';
import { useKitchenBoard } from '../../../state/kitchenBoardStore';
import { RefreshCcw, Volume2, VolumeX, Plus, History } from 'lucide-react';
import { usePOSView } from '../../../state/posViewStore';
import Link from 'next/link';
import { useTranslation } from '../../../hooks/useTranslation';

export const FiltersBar: React.FC = () => {
  const { filters, setFilters, hydrateFromAPI } = useKitchenBoard();
  const { view: posView, setView } = usePOSView();
  const { t } = useTranslation();

  useEffect(() => {
    if (filters.autoRefresh && posView === 'kitchen') {
      const id = setInterval(() => hydrateFromAPI(), 5_000);
      return () => clearInterval(id);
    }
  }, [filters.autoRefresh, hydrateFromAPI, posView]);

  // Re-hydrate when window gains focus for fresher data
  useEffect(() => {
    const onFocus = () => hydrateFromAPI();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [hydrateFromAPI]);

  return (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={t('pos.kitchen.filters.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="px-3 py-2 rounded-lg border bg-white text-sm"
        />
        <button onClick={() => hydrateFromAPI()} className="icon-btn" title={t('pos.kitchen.filters.refresh')}>
          <RefreshCcw className="w-4 h-4" />
        </button>
        <Link
          href="/pos"
          onClick={() => setView('sell')}
          className="icon-btn"
          title={t('pos.kitchen.filters.goToSell')}
        >
          <Plus className="w-4 h-4" />
        </Link>
        <Link href="/pos/history" className="icon-btn" title={t('pos.kitchen.filters.history')}>
          <History className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs flex items-center gap-1">
          <input
            type="checkbox"
            checked={filters.autoRefresh}
            onChange={(e) => setFilters({ autoRefresh: e.target.checked })}
          />
          {t('pos.kitchen.filters.autoRefresh')}
        </label>
        <button
          onClick={() => setFilters({ soundOn: !filters.soundOn })}
          className="icon-btn"
          title={filters.soundOn ? t('pos.kitchen.filters.mute') : t('pos.kitchen.filters.unmute')}
        >
          {filters.soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
      <style jsx>{`
        .icon-btn { @apply p-2 rounded-lg border bg-white hover:bg-gray-50 active:scale-[.98]; }
      `}</style>
    </div>
  );
};
