"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, activeBusiness } from '../lib/api';

export type KitchenStatus = 'new' | 'prep' | 'ready' | 'served';

export interface TicketItem {
  id: string;
  name: string;
  qty: number;
  notes?: string;
}

export interface Ticket {
  id: string;
  code?: string; // short code, e.g. table or order code
  customer?: string | null;
  table?: string | null;
  status: KitchenStatus;
  items: TicketItem[];
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  businessId?: string | number | null;
  priority?: 'normal' | 'high' | 'vip';
}

export interface KitchenFilters {
  search: string;
  onlyPriority: boolean;
  statuses: Record<KitchenStatus, boolean>;
  soundOn: boolean;
  autoRefresh: boolean;
}

interface KitchenBoardState {
  tickets: Ticket[];
  loading: boolean;
  lastSyncAt?: string;
  filters: KitchenFilters;
  // actions
  hydrateFromAPI: () => Promise<void>;
  move: (id: string, to: KitchenStatus) => void;
  addMockTicket: () => void;
  setFilters: (partial: Partial<KitchenFilters>) => void;
  clear: () => void;
}

function normalizeStatus(raw?: string): KitchenStatus {
  const v = (raw || '').toLowerCase();
  if (v.includes('pagad') || v.includes('abier')) return 'new';
  if (v.includes('pre')) return 'prep';
  if (v.includes('list') || v.includes('ready')) return 'ready';
  if (v.includes('entreg') || v.includes('cerr') || v.includes('serve')) return 'served';
  return 'new';
}

function coalesce<T>(obj: any, keys: string[], fallback: T): T {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k] as T;
  }
  return fallback;
}

function mapSaleToTicket(sale: any): Ticket {
  const id = String(coalesce(sale, ['id', 'id_venta', 'saleId'], crypto.randomUUID()));
  const createdAt = coalesce<string>(sale, ['createdAt', 'fecha', 'fecha_creacion', 'fecha_venta'], new Date().toISOString());
  const status = normalizeStatus(coalesce<string>(sale, ['estado', 'status'], 'new'));
  const businessId = coalesce<string | number | null>(sale, ['id_negocio', 'negocioId', 'businessId'], activeBusiness.get());
  const table = coalesce<string | null>(sale, ['mesa', 'table', 'mesa_numero'], null);
  const itemsRaw = (sale?.detalle_venta as any[]) || coalesce<any[]>(sale, ['items', 'detalles', 'line_items', 'productos', 'order_lines'], []);
  const items: TicketItem[] = Array.isArray(itemsRaw)
    ? itemsRaw.map((it: any, idx: number) => {
        const nestedName = it?.producto?.nombre as string | undefined;
        const name = nestedName ?? coalesce<string>(it, ['name', 'producto', 'nombre', 'title'], 'Producto');
        const idDetalle = it?.id_detalle_venta ?? it?.id_detalle ?? it?.id;
        return {
          id: String(idDetalle ?? `${id}-${idx}`),
          name,
          qty: Number(coalesce<number>(it, ['qty', 'cantidad', 'cantidad_producto'], 1)),
          notes: coalesce<string | undefined>(it, ['notes', 'nota', 'observaciones'], undefined),
        };
      })
    : [];
  const code = coalesce<string | undefined>(sale, ['codigo', 'code', 'folio', 'ticket'], undefined);
  return { id, createdAt, status, items, businessId, table, code: code ?? `V-${id}`, customer: coalesce(sale, ['cliente', 'customer'], null), priority: 'normal' };
}

export const useKitchenBoard = create<KitchenBoardState>()(
  persist(
    (set, get) => ({
      tickets: [],
      loading: false,
      filters: {
        search: '',
        onlyPriority: false,
        statuses: { new: true, prep: true, ready: true, served: false },
        soundOn: true,
        autoRefresh: true,
      },
      async hydrateFromAPI() {
        set({ loading: true });
        try {
          const biz = activeBusiness.get() || undefined;
          const sales = await api.getSales({ id_negocio: biz });
          const incoming = sales.map(mapSaleToTicket);
          // Merge by id keeping local statuses if changed
          const local = get().tickets;
          const mergedMap = new Map<string, Ticket>();
          for (const t of local) mergedMap.set(t.id, t);
          for (const t of incoming) {
            const prev = mergedMap.get(t.id);
            if (!prev) mergedMap.set(t.id, t);
            else mergedMap.set(t.id, { ...t, status: prev.status });
          }
          const merged = Array.from(mergedMap.values());
          set({ tickets: merged.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)), lastSyncAt: new Date().toISOString() });
        } catch (e) {
          console.error('hydrateFromAPI error', e);
        } finally {
          set({ loading: false });
        }
      },
      move(id, to) {
        set({ tickets: get().tickets.map(t => (t.id === id ? { ...t, status: to, updatedAt: new Date().toISOString() } : t)) });
      },
      addMockTicket() {
        const id = crypto.randomUUID();
        const sample: Ticket = {
          id,
          code: `MESA-${Math.floor(Math.random() * 20) + 1}`,
          table: String(Math.floor(Math.random() * 20) + 1),
          status: 'new',
          items: [
            { id: `${id}-1`, name: 'Hamburguesa Clásica', qty: 2 },
            { id: `${id}-2`, name: 'Papas Fritas', qty: 1 },
          ],
          createdAt: new Date().toISOString(),
          priority: Math.random() > 0.85 ? 'high' : 'normal',
          businessId: activeBusiness.get(),
        };
        set({ tickets: [sample, ...get().tickets] });
      },
      setFilters(partial) {
        set({ filters: { ...get().filters, ...partial } });
      },
      clear() {
        set({ tickets: [] });
      },
    }),
    { name: 'kitchen-board-store' }
  )
);

// Listen for POS sales to inject immediately into board
if (typeof window !== 'undefined') {
  window.addEventListener('pos:new-sale', (ev: Event) => {
    try {
      const custom = ev as CustomEvent<any>;
      const ticket = mapSaleToTicket(custom.detail);
      const { tickets } = useKitchenBoard.getState();
      const exists = tickets.some(t => t.id === ticket.id);
      if (!exists) {
        useKitchenBoard.setState({ tickets: [ticket, ...tickets] });
      }
    } catch (e) {
      console.error('pos:new-sale handler error', e);
    }
  });
}
