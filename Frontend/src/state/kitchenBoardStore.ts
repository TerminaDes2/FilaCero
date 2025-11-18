"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, activeBusiness } from '../lib/api';

export type KitchenStatus = 'pending' | 'prepping' | 'ready' | 'served';
export type PedidoEstado = 'pendiente' | 'confirmado' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';

export interface TicketItem {
  id: string;
  name: string;
  qty: number;
  notes?: string;
  price?: number;
}

export interface Ticket {
  id: string;
  rawStatus: PedidoEstado;
  status: KitchenStatus;
  createdAt: string;
  updatedAt?: string;
  code?: string;
  table?: string | null;
  customer?: string | null;
  businessId?: string | number | null;
  priority?: 'normal' | 'high' | 'vip';
  total?: number;
  notes?: string | null;
  items: TicketItem[];
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
  error?: string | null;
  filters: KitchenFilters;
  hydrateFromAPI: () => Promise<void>;
  move: (id: string, to: KitchenStatus) => Promise<void>;
  addMockTicket: () => void;
  setFilters: (partial: Partial<KitchenFilters>) => void;
  clear: () => void;
}

const RAW_PIPELINE: PedidoEstado[] = ['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado'];
const FRONT_ORDER: KitchenStatus[] = ['pending', 'prepping', 'ready', 'served'];
const TARGET_RAW_BY_FRONT: Record<KitchenStatus, PedidoEstado> = {
  pending: 'pendiente',
  prepping: 'en_preparacion',
  ready: 'listo',
  served: 'entregado',
};

function sortTickets(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const statusDiff = FRONT_ORDER.indexOf(a.status) - FRONT_ORDER.indexOf(b.status);
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function safeDate(input: unknown): string {
  if (!input) return new Date().toISOString();
  const date = input instanceof Date
    ? input
    : typeof input === 'string' || typeof input === 'number'
      ? new Date(input)
      : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeRawStatus(raw?: string | null): PedidoEstado {
  const value = (raw ?? '').toString().toLowerCase();
  if (value === 'cancelado') return 'cancelado';
  if ((RAW_PIPELINE as readonly string[]).includes(value)) return value as PedidoEstado;
  return 'pendiente';
}

function mapRawToFront(raw: PedidoEstado): KitchenStatus {
  switch (raw) {
    case 'en_preparacion':
      return 'prepping';
    case 'listo':
      return 'ready';
    case 'entregado':
      return 'served';
    default:
      return 'pending';
  }
}

function computeForwardSequence(current: PedidoEstado, target: PedidoEstado): PedidoEstado[] {
  if (current === 'cancelado') return [];
  const currentIndex = RAW_PIPELINE.indexOf(current);
  const targetIndex = RAW_PIPELINE.indexOf(target);
  if (targetIndex === -1) return [];
  if (currentIndex === -1) {
    return RAW_PIPELINE.slice(0, targetIndex + 1);
  }
  if (currentIndex >= targetIndex) return [];
  return RAW_PIPELINE.slice(currentIndex + 1, targetIndex + 1);
}

function derivePriority(pedido: any): Ticket['priority'] {
  const prioridad = (pedido?.prioridad ?? '').toString().toLowerCase();
  const notas = (pedido?.notas_cliente ?? '').toString().toLowerCase();
  if (prioridad.includes('alta') || prioridad.includes('high') || prioridad.includes('urgent') || notas.includes('urgente') || notas.includes('prioridad')) {
    return 'high';
  }
  return 'normal';
}

function mapPedidoToTicket(pedido: any): Ticket | null {
  if (!pedido) return null;
  const raw = normalizeRawStatus(pedido.estado);
  if (raw === 'cancelado') return null;
  const status = mapRawToFront(raw);
  const detalle = Array.isArray(pedido.detalle_pedido) ? pedido.detalle_pedido : [];
  const items: TicketItem[] = detalle.map((item: any, index: number) => ({
    id: String(item.id_detalle ?? `${pedido.id_pedido}-${index}`),
    name: item.producto?.nombre ?? item.nombre ?? 'Producto',
    qty: Number(item.cantidad ?? 1),
    notes: item.notas ?? undefined,
    price: item.precio_unitario != null ? Number(item.precio_unitario) : undefined,
  }));
  const total = pedido.total != null ? Number(pedido.total) : undefined;
  const createdAt = safeDate(pedido.fecha_creacion ?? pedido.creado_en);
  const updatedAt = pedido.actualizado_en ? safeDate(pedido.actualizado_en) : undefined;
  const customer = pedido.nombre_cliente ?? pedido.usuario?.nombre ?? (pedido.email_cliente ? String(pedido.email_cliente).split('@')[0] : null);
  const code = pedido.codigo ?? pedido.folio ?? pedido.numero_orden ?? undefined;
  const table = pedido.mesa ?? pedido.numero_mesa ?? null;

  return {
    id: String(pedido.id_pedido ?? pedido.id ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now())),
    rawStatus: raw,
    status,
    createdAt,
    updatedAt,
    code: code ? String(code) : `PED-${pedido.id_pedido ?? ''}`.trim(),
    table: table != null ? String(table) : null,
    customer: customer ? String(customer) : null,
    businessId: pedido.id_negocio ?? activeBusiness.get(),
    priority: derivePriority(pedido),
    total,
    notes: pedido.notas_cliente ? String(pedido.notas_cliente) : null,
    items,
  };
}

export const useKitchenBoard = create<KitchenBoardState>()(
  persist(
    (set, get) => ({
      tickets: [],
      loading: false,
      error: null,
      filters: {
        search: '',
        onlyPriority: false,
        statuses: { pending: true, prepping: true, ready: true, served: false },
        soundOn: true,
        autoRefresh: true,
      },
      async hydrateFromAPI() {
        const biz = activeBusiness.get();
        if (!biz) {
          set({
            tickets: [],
            loading: false,
            lastSyncAt: new Date().toISOString(),
            error: 'Selecciona un negocio para ver la cocina.',
          });
          return;
        }

        set({ loading: true, error: null });
        try {
          const raw = await api.getKitchenBoard(biz);
          const payload = raw?.data ?? raw;
          const nextTickets: Ticket[] = [];

          if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
            Object.values(payload).forEach((list: any) => {
              if (!Array.isArray(list)) return;
              list.forEach((pedido) => {
                const ticket = mapPedidoToTicket(pedido);
                if (ticket) nextTickets.push(ticket);
              });
            });
          } else if (Array.isArray(payload)) {
            payload.forEach((pedido) => {
              const ticket = mapPedidoToTicket(pedido);
              if (ticket) nextTickets.push(ticket);
            });
          }

          set({
            tickets: sortTickets(nextTickets),
            loading: false,
            lastSyncAt: new Date().toISOString(),
            error: null,
          });
        } catch (error) {
          console.error('hydrateFromAPI error', error);
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'No se pudo sincronizar la cocina',
          });
        }
      },
      async move(id, to) {
        const state = get();
        const ticket = state.tickets.find((t) => t.id === id);
        if (!ticket) return;
        if (to === 'pending') return; // Backend no permite regresar estados iniciales

        const targetRaw = TARGET_RAW_BY_FRONT[to];
        const currentRaw = normalizeRawStatus(ticket.rawStatus);
        const sequence = computeForwardSequence(currentRaw, targetRaw);
        if (sequence.length === 0) return;

        const finalRawTarget = sequence[sequence.length - 1];
        const isNumericId = /^\d+$/.test(id);
        const requestId = isNumericId ? id.trim() : null;

        set({
          tickets: state.tickets.map((t) => (t.id === id ? { ...t, status: to } : t)),
        });

        const finalizeTicket = (raw: PedidoEstado) => {
          set({
            tickets: get().tickets.map((t) =>
              t.id === id
                ? {
                    ...t,
                    rawStatus: raw,
                    status: mapRawToFront(raw),
                    updatedAt: new Date().toISOString(),
                  }
                : t
            ),
            lastSyncAt: new Date().toISOString(),
            error: null,
          });
        };

        if (!requestId) {
          finalizeTicket(finalRawTarget);
          return;
        }

        try {
          let latestRaw = currentRaw;
          for (const rawStatus of sequence) {
            await api.updateKitchenOrderStatus(requestId, rawStatus);
            latestRaw = rawStatus;
          }

          finalizeTicket(latestRaw);
          void get().hydrateFromAPI();
        } catch (error) {
          console.error('move ticket error', error);
          set({
            error: error instanceof Error ? error.message : 'No se pudo actualizar el pedido',
          });
          await get().hydrateFromAPI();
        }
      },
      addMockTicket() {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mock-${Date.now()}`;
        const sample: Ticket = {
          id,
          rawStatus: 'pendiente',
          status: 'pending',
          createdAt: new Date().toISOString(),
          customer: 'Cliente Demo',
          code: `M-${Math.floor(Math.random() * 90 + 10)}`,
          businessId: activeBusiness.get(),
          priority: Math.random() > 0.8 ? 'high' : 'normal',
          items: [
            { id: `${id}-1`, name: 'Hamburguesa Clásica', qty: 2 },
            { id: `${id}-2`, name: 'Papas Fritas', qty: 1 },
          ],
          total: 210,
          notes: null,
        };
        set({ tickets: [sample, ...get().tickets] });
      },
      setFilters(partial) {
        set({
          filters: {
            ...get().filters,
            ...partial,
            statuses: partial.statuses
              ? { ...get().filters.statuses, ...partial.statuses }
              : get().filters.statuses,
          },
        });
      },
      clear() {
        set({ tickets: [], lastSyncAt: undefined });
      },
    }),
    {
      name: 'kitchen-board-store',
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState;
        persistedState.tickets = [];
        persistedState.loading = false;
        persistedState.error = null;
        const prevFilters = persistedState.filters ?? {};
        const prevStatuses = prevFilters.statuses ?? {};
        persistedState.filters = {
          search: prevFilters.search ?? '',
          onlyPriority: prevFilters.onlyPriority ?? false,
          soundOn: prevFilters.soundOn ?? true,
          autoRefresh: prevFilters.autoRefresh ?? true,
          statuses: {
            pending: prevStatuses.pending ?? prevStatuses.new ?? true,
            prepping: prevStatuses.prepping ?? prevStatuses.prep ?? true,
            ready: prevStatuses.ready ?? true,
            served: prevStatuses.served ?? false,
          },
        } as KitchenFilters;
        return persistedState;
      },
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('pos:new-sale', (event: Event) => {
    const custom = event as CustomEvent<any>;
    const payload = custom?.detail;
    const pedido = payload?.pedido ?? null;

    if (pedido) {
      const ticket = mapPedidoToTicket(pedido);
      if (ticket) {
        useKitchenBoard.setState((state) => {
          const filtered = state.tickets.filter((t) => t.id !== ticket.id);
          return {
            tickets: sortTickets([ticket, ...filtered]),
            lastSyncAt: new Date().toISOString(),
            error: null,
          };
        });
        return;
      }
    }

    void useKitchenBoard.getState().hydrateFromAPI();
  });
}
