"use client";
import React from 'react';
import { KitchenStatus, Ticket } from '../../../state/kitchenBoardStore';
import { Clock, Loader2, CheckCircle2, UtensilsCrossed } from 'lucide-react';

const statusMeta: Record<KitchenStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'Nuevo', color: 'border-blue-400 bg-blue-50', icon: <Clock className="w-4 h-4 text-blue-500" /> },
  prep: { label: 'Preparando', color: 'border-yellow-400 bg-yellow-50', icon: <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" /> },
  ready: { label: 'Listo', color: 'border-green-400 bg-green-50', icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
  served: { label: 'Entregado', color: 'border-gray-400 bg-gray-50', icon: <UtensilsCrossed className="w-4 h-4 text-gray-500" /> },
};

interface Props {
  ticket: Ticket;
  onMove: (to: KitchenStatus) => void;
}

export const TicketCard: React.FC<Props> = ({ ticket, onMove }) => {
  const meta = statusMeta[ticket.status];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', ticket.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group rounded-xl border shadow-sm p-3 flex flex-col gap-2 text-sm transition hover:shadow-md cursor-grab active:cursor-grabbing ${meta.color}`}
      style={{ background: 'var(--pos-card-bg)', borderColor: 'var(--pos-card-border)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          {meta.icon}
          <span>{meta.label}</span>
        </div>
        {ticket.priority === 'high' && (
          <span className="text-xs font-semibold text-red-600 animate-pulse">PRIORIDAD</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {ticket.items.map(it => (
          <div key={it.id} className="px-2 py-1 rounded bg-white/70 border text-xs flex items-center gap-1">
            <span className="font-semibold">{it.qty}×</span>
            <span>{it.name}</span>
          </div>
        ))}
      </div>
  {/* notes removed until backend provides order-level notes */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-auto pt-1">
        <span>{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span>{ticket.code || ticket.table || ticket.id.slice(-5)}</span>
      </div>
      <div className="flex gap-1 flex-wrap mt-1">
        {ticket.status !== 'new' && ticket.status !== 'served' && (
          <button onClick={() => onMove('new')} className="action-btn">↩️</button>
        )}
        {ticket.status === 'new' && (
          <button onClick={() => onMove('prep')} className="action-btn">Preparar</button>
        )}
        {ticket.status === 'prep' && (
          <button onClick={() => onMove('ready')} className="action-btn">Listo</button>
        )}
        {ticket.status === 'ready' && (
          <button onClick={() => onMove('served')} className="action-btn">Servido</button>
        )}
      </div>
      <style jsx>{`
        .action-btn {
          @apply text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100 active:scale-[.97];
        }
      `}</style>
    </div>
  );
};
