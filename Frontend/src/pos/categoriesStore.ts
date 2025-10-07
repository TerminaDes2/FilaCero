"use client";
import { create } from 'zustand';

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
  add: (name: string, color?: CategoryColor, icon?: string) => void;
  update: (id: string, patch: Partial<Pick<CategoryItem, 'name' | 'icon' | 'color'>>) => void;
  remove: (id: string) => void;
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
  add: (name, color = 'brand', icon) => {
    name = name.trim();
    if (!name) return;
    const exists = get().categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    set({ categories: [...get().categories, { id: uid(), name, color, icon }] });
  },
  update: (id, patch) => {
    set({ categories: get().categories.map(c => c.id === id ? { ...c, ...patch } : c) });
  },
  remove: (id) => {
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
