"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';
export type POSView = 'grid' | 'list';
export type LocaleCode = 'es-MX' | 'es-ES' | 'en-US';
export type CurrencyCode = 'MXN' | 'USD' | 'EUR';

interface SettingsState {
  // Appearance
  density: Density;
  accentTeal: boolean;

  // POS
  defaultView: POSView;
  showStock: boolean;
  confirmRemove: boolean;

  // Locale
  locale: LocaleCode;
  currency: CurrencyCode;
  dateFormat: 'auto' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

  // Notifications (UI only)
  notifyDaily: boolean;
  notifyLowStock: boolean;

  // Payments (UI only)
  payCash: boolean;
  payCard: boolean;
  tipsEnabled: boolean;

  set: (partial: Partial<SettingsState>) => void;
  reset: () => void;
}

const defaults: Omit<SettingsState, 'set' | 'reset'> = {
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
  payCash: true,
  payCard: true,
  tipsEnabled: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaults,
      set: (partial) => set({ ...get(), ...partial }),
      reset: () => set({ ...defaults }),
    }),
    { name: 'posSettings' }
  )
);
