"use client";
import React, { useEffect, useMemo } from 'react';
import { useKitchenBoard, KitchenStatus } from '../../../state/kitchenBoardStore';
import { BoardColumn } from './BoardColumn';
import { FiltersBar } from './FiltersBar';
import { useTranslation } from '../../../hooks/useTranslation';

export const KitchenBoard: React.FC = () => {
  const { t } = useTranslation();
  const { hydrateFromAPI, tickets, move, cancel, filters, loading, lastSyncAt, error } = useKitchenBoard();

  useEffect(() => { hydrateFromAPI(); }, [hydrateFromAPI]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return tickets.filter(t => {
      if (q && !(t.code?.toLowerCase().includes(q) || t.table?.toLowerCase().includes(q))) return false;
      const enabled = filters.statuses[t.status];
      if (enabled === false) return false;
      if (filters.onlyPriority && t.priority !== 'high') return false;
      return true;
    });
  }, [tickets, filters]);

  const byStatus: Record<KitchenStatus, typeof filtered> = { pending: [], prepping: [], ready: [], served: [] };
  filtered.forEach(t => { byStatus[t.status].push(t); });

  const columns: { title: string; status: KitchenStatus }[] = useMemo(() => [
    { title: t('pos.kitchen.pending'), status: 'pending' },
    { title: t('pos.kitchen.prepping'), status: 'prepping' },
    { title: t('pos.kitchen.ready'), status: 'ready' },
    { title: t('pos.kitchen.served'), status: 'served' },
  ], [t]);

  const relativeSync = React.useMemo(() => {
    if (!lastSyncAt) return null;
    const diffMs = Date.now() - new Date(lastSyncAt).getTime();
    if (Number.isNaN(diffMs)) return null;
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return t('pos.kitchen.syncedSecondsAgo');
    if (minutes === 1) return t('pos.kitchen.syncedOneMinuteAgo');
    if (minutes < 60) return t('pos.kitchen.syncedMinutesAgo', { minutes });
    const hours = Math.round(minutes / 60);
    if (hours === 1) return t('pos.kitchen.syncedOneHourAgo');
    if (hours < 6) return t('pos.kitchen.syncedHoursAgo', { hours });
    return new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [lastSyncAt]);

  return (
    <section
      className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-t-2xl px-4 md:px-5 pt-4 pb-3"
      style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 0 0 1px var(--pos-border-soft)' }}
    >
      <header className="mb-3">
        <div className="rounded-2xl px-3 md:px-4 py-3 bg-white border shadow-sm" style={{ borderColor: 'var(--pos-card-border)' }}>
          <FiltersBar />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>{loading ? t('pos.kitchen.syncing') : relativeSync ?? t('pos.kitchen.waitingData')}</span>
            {error && <span className="text-rose-600 font-medium">{error}</span>}
          </div>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto custom-scroll-area">
        <div className="flex gap-4 pr-1 pb-2 min-w-max">
          {columns.map(({ title, status }) => (
            <BoardColumn key={status} title={title} status={status} tickets={byStatus[status]} onMove={move} onCancel={cancel} />
          ))}
        </div>
      </div>
    </section>
  );
};
