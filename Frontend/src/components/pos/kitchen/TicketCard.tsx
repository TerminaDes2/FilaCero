"use client";
import React from 'react';
import { KitchenStatus, Ticket } from '../../../state/kitchenBoardStore';
import { Clock, Loader2, CheckCircle2, UtensilsCrossed, User, StickyNote } from 'lucide-react';
import { useConfirm } from '../../system/ConfirmProvider';

const statusMeta: Record<KitchenStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'border-sky-400 bg-sky-50', icon: <Clock className="w-4 h-4 text-sky-500" /> },
  prepping: { label: 'En preparación', color: 'border-amber-400 bg-amber-50', icon: <Loader2 className="w-4 h-4 text-amber-500 animate-spin" /> },
  ready: { label: 'Listo', color: 'border-emerald-400 bg-emerald-50', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  served: { label: 'Entregado', color: 'border-slate-300 bg-slate-50', icon: <UtensilsCrossed className="w-4 h-4 text-slate-500" /> },
};

const actions: Partial<Record<KitchenStatus, { label: string; to: KitchenStatus }>> = {
  pending: { label: 'Iniciar prep.', to: 'prepping' },
  prepping: { label: 'Marcar listo', to: 'ready' },
  ready: { label: 'Entregar', to: 'served' },
};

const currencyFormatter = typeof Intl !== 'undefined'
  ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
  : null;

function formatSince(iso?: string) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'hace instantes';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}

interface Props {
  ticket: Ticket;
  onMove: (to: KitchenStatus) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

export const TicketCard: React.FC<Props> = ({ ticket, onMove, onCancel }) => {
  const confirm = useConfirm();
  const meta = statusMeta[ticket.status];
  const action = actions[ticket.status];
  const draggable = ticket.status !== 'served';
  const itemsPreview = ticket.items.slice(0, 4);
  const remaining = ticket.items.length - itemsPreview.length;
  const totalLabel = ticket.total != null && currencyFormatter ? currencyFormatter.format(ticket.total) : undefined;

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData('text/plain', ticket.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group rounded-xl border shadow-sm p-3 flex flex-col gap-2 text-sm transition ${
        draggable ? 'hover:shadow-md cursor-grab active:cursor-grabbing' : 'cursor-default opacity-90'
      } ${meta.color}`}
      style={{ background: 'var(--pos-card-bg)', borderColor: 'var(--pos-card-border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          {meta.icon}
          <span>{meta.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {ticket.priority === 'high' && (
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-semibold uppercase tracking-wide text-[10px]">Prioridad</span>
          )}
          {totalLabel && <span className="font-medium text-gray-700">{totalLabel}</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
        {ticket.code && <span className="px-2 py-0.5 rounded bg-white/70 border font-medium">{ticket.code}</span>}
        {ticket.table && <span className="px-2 py-0.5 rounded bg-white/60 border">Mesa {ticket.table}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {itemsPreview.map((it) => (
          <div key={it.id} className="px-2 py-1 rounded bg-white/80 border text-xs flex items-center gap-1">
            <span className="font-semibold">{it.qty}&times;</span>
            <span>{it.name}</span>
          </div>
        ))}
        {remaining > 0 && (
          <span className="px-2 py-1 rounded bg-white/60 border text-xs text-gray-600">+{remaining}</span>
        )}
      </div>

      {ticket.notes && (
        <div className="flex items-start gap-1 text-xs text-gray-600 bg-white/70 border rounded-lg px-2 py-1">
          <StickyNote className="w-3.5 h-3.5 mt-0.5 text-amber-500" />
          <span className="leading-tight">{ticket.notes}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-gray-500 mt-auto pt-1">
        <span>{formatSince(ticket.createdAt)}</span>
        <span>{ticket.id.slice(-6)}</span>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500">
        {ticket.customer ? (
          <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{ticket.customer}</span>
        ) : <span />}
        {ticket.updatedAt && ticket.status !== 'pending' && (
          <span>Últ. mov {formatSince(ticket.updatedAt)}</span>
        )}
      </div>

      {action && (
        <div className="flex gap-2 flex-wrap mt-2 items-center">
          <button
            onClick={() => void onMove(action.to)}
            className="text-xs px-3 py-1.5 rounded border bg-white font-medium text-gray-700 hover:bg-gray-100 active:scale-[.97] transition"
          >
            {action.label}
          </button>
          {onCancel && (ticket.status === 'pending' || ticket.status === 'prepping') && (
            <button
              onClick={() => {
                void (async () => {
                  try {
                    const ok = await confirm({ title: 'Cancelar pedido', description: '¿Deseas cancelar este pedido? Se enviará un correo al cliente.', confirmText: 'Cancelar', cancelText: 'Mantener', tone: 'danger' });
                    if (ok) await onCancel();
                  } catch (e) {
                    console.error('Confirm modal failed', e);
                    const ok = window.confirm('¿Cancelar pedido? Esta acción enviará un correo al cliente.');
                    if (ok) await onCancel();
                  }
                })();
              }}
              className="text-xs px-3 py-1.5 rounded border bg-white text-rose-600 hover:bg-rose-50 active:scale-[.97] transition"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
};
