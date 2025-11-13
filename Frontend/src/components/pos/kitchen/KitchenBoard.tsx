"use client";
import React, { useEffect, useMemo } from 'react';
import { useKitchenBoard, KitchenStatus } from '../../../state/kitchenBoardStore';
import { BoardColumn } from './BoardColumn';
import { FiltersBar } from './FiltersBar';

export const KitchenBoard: React.FC = () => {
  const { hydrateFromAPI, tickets, move, filters } = useKitchenBoard();

  useEffect(() => { hydrateFromAPI(); }, [hydrateFromAPI]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return tickets.filter(t => {
      if (q && !(t.code?.toLowerCase().includes(q) || t.table?.toLowerCase().includes(q))) return false;
      if (!filters.statuses[t.status]) return false;
      if (filters.onlyPriority && t.priority !== 'high') return false;
      return true;
    });
  }, [tickets, filters]);

  const byStatus: Record<KitchenStatus, typeof filtered> = { new: [], prep: [], ready: [], served: [] };
  filtered.forEach(t => { byStatus[t.status].push(t); });

  return (
    <section
      className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-t-2xl px-4 md:px-5 pt-4 pb-3"
      style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 0 0 1px var(--pos-border-soft)' }}
    >
      <header className="mb-3">
        <div className="rounded-2xl px-3 md:px-4 py-3 bg-white border shadow-sm" style={{ borderColor: 'var(--pos-card-border)' }}>
          <FiltersBar />
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto custom-scroll-area">
        <div className="flex gap-4 pr-1 pb-2 min-w-max">
          <BoardColumn title="Nuevos" status="new" tickets={byStatus.new} onMove={move} />
          <BoardColumn title="Preparando" status="prep" tickets={byStatus.prep} onMove={move} />
          <BoardColumn title="Listos" status="ready" tickets={byStatus.ready} onMove={move} />
          <BoardColumn title="Entregados" status="served" tickets={byStatus.served} onMove={move} />
        </div>
      </div>
    </section>
  );
};
