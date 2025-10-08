"use client";
import { create } from 'zustand';
import { api } from '../lib/api';

export type CategoryColor = 'brand' | 'teal' | 'amber' | 'gray' | 'rose';

export interface CategoryItem {
  id: string;
  name: string;
  icon?: string; // emoji or short text
  color: CategoryColor;
}

interface CategoriesState {
  categories: CategoryItem[];
  selected: string; // 'all' or category name
  bootstrap: (names: string[]) => void;
  fetchCategories: () => Promise<void>;
  add: (name: string, color?: CategoryColor, icon?: string) => Promise<void>;
  update: (id: string, patch: Partial<Pick<CategoryItem, 'name' | 'icon' | 'color'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  replaceAll: (items: CategoryItem[]) => void;
  setSelected: (name: string) => void;
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  selected: 'all',
  bootstrap: (names) => {
    const curr = get().categories;
    if (curr.length > 0) return;
    const uniq = Array.from(new Set(names.filter(Boolean)));
    const seeded = uniq.map((n, i) => ({ id: uid(), name: n, color: (i % 3 === 0 ? 'brand' : i % 3 === 1 ? 'teal' : 'amber') as CategoryColor }));
    set({ categories: seeded });
  },
  fetchCategories: async () => {
    try {
      const data = await api.getCategories();
      const items: CategoryItem[] = (Array.isArray(data) ? data : []).map((it: any, idx: number) => ({
        id: String(it.id_categoria ?? it.id ?? uid()),
        name: String(it.nombre ?? it.name ?? ''),
        icon: (it.icon ?? undefined) as string | undefined,
        color: (['brand','teal','amber','gray','rose'][idx % 5] as CategoryColor)
      })).filter(it => it.id && it.name);
      set({ categories: items });
    } catch (e) {
      // si falla, mantenemos el estado actual
      console.warn('No se pudieron cargar categorías', e);
    }
  },
  add: async (name, color = 'brand', icon) => {
    name = name.trim();
    if (!name) return;
    const exists = get().categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    try {
      const created = await api.createCategory({ nombre: name });
      const id = String(created?.id_categoria ?? created?.id ?? uid());
      set({ categories: [...get().categories, { id, name, color, icon }] });
    } catch (e) {
      // superficie error al llamador si lo necesita
      throw e;
    }
  },
  update: async (id, patch) => {
    try {
      if (patch.name && patch.name.trim()) {
        await api.updateCategory(id, { nombre: patch.name.trim() });
      }
      // color/icon se manejan localmente
      set({ categories: get().categories.map(c => c.id === id ? { ...c, ...patch } : c) });
    } catch (e) {
      throw e;
    }
  },
  remove: async (id) => {
    try {
      await api.deleteCategory(id);
    } catch (e) {
      // Si falla el backend, no mutamos el estado.
      throw e;
    }
    const next = get().categories.filter(c => c.id !== id);
    const sel = get().selected;
    const stillExists = next.some(c => c.name === sel);
    set({ categories: next, selected: stillExists ? sel : 'all' });
  },
  moveUp: (id) => {
    const items = get().categories.slice();
    const idx = items.findIndex(c => c.id === id);
    if (idx > 0) {
      const [it] = items.splice(idx, 1);
      items.splice(idx - 1, 0, it);
      set({ categories: items });
    }
  },
  moveDown: (id) => {
    const items = get().categories.slice();
    const idx = items.findIndex(c => c.id === id);
    if (idx >= 0 && idx < items.length - 1) {
      const [it] = items.splice(idx, 1);
      items.splice(idx + 1, 0, it);
      set({ categories: items });
    }
  },
  replaceAll: (items) => set({ categories: items }),
  setSelected: (name) => set({ selected: name || 'all' })
}));
