"use client";
import React from 'react';
import { KitchenStatus, Ticket } from '../../../state/kitchenBoardStore';
import { TicketCard } from './TicketCard';

interface Props {
  title: string;
  status: KitchenStatus;
  tickets: Ticket[];
  onMove: (id: string, to: KitchenStatus) => void | Promise<void>;
  onCancel?: (id: string) => void | Promise<void>;
}

export const BoardColumn: React.FC<Props> = ({ title, status, tickets, onMove }) => {
  const [over, setOver] = React.useState(false);
  return (
    <div
      className={`flex-1 min-w-[260px] rounded-2xl border shadow-sm p-3 flex flex-col gap-3 bg-white transition ${over ? 'ring-2 ring-[var(--pos-accent-green)]' : ''}`}
      style={{ background: 'var(--pos-card-bg)', borderColor: 'var(--pos-card-border)' }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) void onMove(id, status);
      }}
    >
      <h3 className="text-sm font-semibold px-1" style={{ color: 'var(--pos-text-heading)' }}>{title} ({tickets.length})</h3>
      <div className="flex flex-col gap-3">
        {tickets.map(t => (
          <TicketCard key={t.id} ticket={t} onMove={(to) => onMove(t.id, to)} onCancel={() => onCancel && onCancel(t.id)} />
        ))}
        {tickets.length === 0 && (
          <div className="text-xs px-1 py-6 text-center" style={{ color: 'var(--pos-text-muted)' }}>Nada por aquí…</div>
        )}
      </div>
    </div>
  );
};
