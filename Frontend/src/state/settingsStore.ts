"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';
export type POSView = 'grid' | 'list';
export type LocaleCode = 'es-MX' | 'es-ES' | 'en-US';
export type CurrencyCode = 'MXN' | 'USD' | 'EUR';
export type ReceiptPaperWidth = '58mm' | '80mm';

export interface DeviceEntry {
  id: string;
  name: string;
  kind: 'printer' | 'terminal' | 'kds';
  status: 'connected' | 'disconnected';
  lastSeen?: string | null;
  autoPrint?: boolean;
}

export interface TaxRate {
  id: string;
  label: string;
  rate: number;
  appliesToAll: boolean;
}

export interface ShortcutEntry {
  id: string;
  label: string;
  combo: string;
  readOnly?: boolean;
}

export interface BusinessExtra {
  slogan: string;
  fiscalId: string;
  legalName: string;
  fiscalAddress: string;
  website: string;
  horarioWeek: string;
  horarioSat: string;
  horarioSun: string;
  heroImage: string;
}

export type SettingsSnapshot = Omit<
  SettingsState,
  | 'set'
  | 'reset'
  | 'replace'
  | 'snapshot'
  | 'addDevice'
  | 'updateDevice'
  | 'removeDevice'
  | 'addTax'
  | 'updateTax'
  | 'removeTax'
  | 'setShortcuts'
  | 'mergeBusinessExtra'
>;

interface SettingsState {
  density: Density;
  accentTeal: boolean;
  defaultView: POSView;
  showStock: boolean;
  confirmRemove: boolean;
  locale: LocaleCode;
  currency: CurrencyCode;
  dateFormat: 'auto' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  notifyDaily: boolean;
  notifyLowStock: boolean;
  notifyEmail: string;
  payCash: boolean;
  payCard: boolean;
  tipsEnabled: boolean;
  tipPercents: string;
  twoFactorEnabled: boolean;
  receiptPaperWidth: ReceiptPaperWidth;
  receiptShowLogo: boolean;
  receiptTaxBreakdown: boolean;
  receiptHeader: string;
  receiptFooter: string;
  businessExtra: BusinessExtra;
  devices: DeviceEntry[];
  taxes: TaxRate[];
  shortcuts: ShortcutEntry[];
  set: (partial: Partial<SettingsState>) => void;
  replace: (next: Partial<SettingsState>) => void;
  reset: () => void;
  snapshot: () => SettingsSnapshot;
  addDevice: (device: DeviceEntry) => void;
  updateDevice: (id: string, patch: Partial<DeviceEntry>) => void;
  removeDevice: (id: string) => void;
  addTax: (tax: TaxRate) => void;
  updateTax: (id: string, patch: Partial<TaxRate>) => void;
  removeTax: (id: string) => void;
  setShortcuts: (shortcuts: ShortcutEntry[]) => void;
  mergeBusinessExtra: (updates: Partial<BusinessExtra>) => void;
}

const defaults: Omit<SettingsState, 'set' | 'replace' | 'reset' | 'snapshot' | 'addDevice' | 'updateDevice' | 'removeDevice' | 'addTax' | 'updateTax' | 'removeTax' | 'setShortcuts' | 'mergeBusinessExtra'> = {
  density: 'comfortable',
  accentTeal: true,
  defaultView: 'grid',
  showStock: true,
  confirmRemove: true,
  locale: 'es-MX',
  currency: 'MXN',
  dateFormat: 'auto',
  notifyDaily: true,
  notifyLowStock: true,
  notifyEmail: '',
  payCash: true,
  payCard: true,
  tipsEnabled: true,
  tipPercents: '5,10,15',
  twoFactorEnabled: false,
  receiptPaperWidth: '80mm',
  receiptShowLogo: true,
  receiptTaxBreakdown: true,
  receiptHeader: '',
  receiptFooter: 'Gracias por su compra',
  businessExtra: {
    slogan: '',
    fiscalId: '',
    legalName: '',
    fiscalAddress: '',
    website: '',
    horarioWeek: 'Lun-Vie: 08:00-20:00',
    horarioSat: 'Sáb: 09:00-14:00',
    horarioSun: 'Dom: cerrado',
    heroImage: '',
  },
  devices: [],
  taxes: [
    { id: 'tax-iva-16', label: 'IVA', rate: 16, appliesToAll: true },
  ],
  shortcuts: [
    { id: 'search', label: 'Abrir búsqueda', combo: '⌘K', readOnly: true },
    { id: 'new-sale', label: 'Nueva venta', combo: 'N', readOnly: true },
    { id: 'add-cart', label: 'Agregar al carrito', combo: 'A', readOnly: false },
  ],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaults,
      set: (partial) => set((state) => ({ ...state, ...partial })),
      replace: (next) => set((state) => ({ ...state, ...next })),
      reset: () => set((state) => ({ ...state, ...defaults })),
      snapshot: () => {
        const {
          set,
          replace,
          reset,
          snapshot,
          addDevice,
          updateDevice,
          removeDevice,
          addTax,
          updateTax,
          removeTax,
          setShortcuts,
          mergeBusinessExtra,
          ...rest
        } = get();
        return JSON.parse(JSON.stringify(rest));
      },
      addDevice: (device) =>
        set((state) => {
          const filtered = state.devices.filter((d) => d.id !== device.id);
          return { ...state, devices: [...filtered, device] };
        }),
      updateDevice: (id, patch) =>
        set((state) => ({
          ...state,
          devices: state.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      removeDevice: (id) =>
        set((state) => ({
          ...state,
          devices: state.devices.filter((d) => d.id !== id),
        })),
      addTax: (tax) =>
        set((state) => ({
          ...state,
          taxes: [...state.taxes.filter((t) => t.id !== tax.id), tax],
        })),
      updateTax: (id, patch) =>
        set((state) => ({
          ...state,
          taxes: state.taxes.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTax: (id) =>
        set((state) => ({
          ...state,
          taxes: state.taxes.filter((t) => t.id !== id),
        })),
      setShortcuts: (shortcuts) => set((state) => ({ ...state, shortcuts })),
      mergeBusinessExtra: (updates) =>
        set((state) => {
          if (!updates || Object.keys(updates).length === 0) return state;
          let changed = false;
          const nextExtra: BusinessExtra = { ...state.businessExtra };
          for (const [key, rawValue] of Object.entries(updates)) {
            const value = typeof rawValue === 'string' ? rawValue : rawValue ?? '';
            const typedKey = key as keyof BusinessExtra;
            if (nextExtra[typedKey] === value) continue;
            nextExtra[typedKey] = value as BusinessExtra[typeof typedKey];
            changed = true;
          }
          if (!changed) return state;
          return {
            ...state,
            businessExtra: nextExtra,
          };
        }),
    }),
    {
      name: 'posSettings',
      partialize: (state) => {
        const {
          set,
          replace,
          reset,
          snapshot,
          addDevice,
          updateDevice,
          removeDevice,
          addTax,
          updateTax,
          removeTax,
          setShortcuts,
          mergeBusinessExtra,
          ...rest
        } = state;
        return rest;
      },
    }
  )
);
