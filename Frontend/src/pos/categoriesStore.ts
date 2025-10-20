"use client";

import { create, type StateCreator } from 'zustand';
import { api, activeBusiness } from '../lib/api';

export type CategoryColor = 'brand' | 'teal' | 'amber' | 'gray' | 'rose';

export interface CategoryItem {
  id: string;
  name: string;
  icon?: string;
  color: CategoryColor;
  scope: 'global' | 'business';
  businessId?: string | null;
}

interface ApiCategory {
  id_categoria?: string | number;
  nombre?: string;
  negocio_id?: string | number | null;
  [key: string]: unknown;
}

interface CategoriesState {
  categories: CategoryItem[];
  selected: string;
  bootstrap: (names: string[]) => void;
  fetchCategories: () => Promise<void>;
  add: (name: string, color?: CategoryColor, icon?: string) => Promise<CategoryItem>;
  update: (id: string, patch: Partial<Pick<CategoryItem, 'name' | 'icon' | 'color'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  replaceAll: (items: CategoryItem[]) => void;
  setSelected: (name: string) => void;
}

type CategoriesStoreCreator = StateCreator<CategoriesState, [], [], CategoriesState>;

const CATEGORY_COLOR_PALETTE: CategoryColor[] = ['brand', 'teal', 'amber', 'gray', 'rose'];

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const categoriesStore: CategoriesStoreCreator = (set, get) => ({
  categories: [],
  selected: 'all',
  bootstrap: (names: string[]) => {
    const curr = get().categories;
    if (curr.length > 0) return;
    const uniq = Array.from(new Set(names.filter(Boolean)));
    const seeded = uniq.map((n, i) => ({
      id: uid(),
      name: n,
      color: (i % 3 === 0 ? 'brand' : i % 3 === 1 ? 'teal' : 'amber') as CategoryColor,
      scope: 'global' as const,
      businessId: null,
    }));
    set({ categories: seeded });
  },
  fetchCategories: async () => {
    let negocioId: string | undefined;
    try { negocioId = activeBusiness.get() || undefined; } catch {}
    if (!negocioId) {
      const envNegocio = process.env.NEXT_PUBLIC_NEGOCIO_ID;
      if (envNegocio) negocioId = envNegocio;
    }
    if (!negocioId) {
      set({ categories: [] });
      throw new Error('Selecciona un negocio activo para cargar categorías.');
    }
    try {
      const data = await api.getCategories({ id_negocio: negocioId });
      const prevById = new Map<string, CategoryItem>(
        get().categories.map((category) => [category.id, category]),
      );
      const normalized: CategoryItem[] = (Array.isArray(data) ? (data as ApiCategory[]) : []).map(
        (item, index) => {
          const rawId = item.id_categoria ?? (item as any)?.id ?? (item as any)?.uuid ?? index;
          const id = String(rawId);
          const name = (item.nombre ?? (item as any)?.name ?? '').toString().trim();
          const prev = prevById.get(id);
          const rawNegocio = item.negocio_id ?? (item as any)?.negocioId ?? null;
          const businessScoped = rawNegocio != null;
          return {
            id,
            name,
            color: prev?.color ?? CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length],
            icon: prev?.icon,
            scope: businessScoped ? ('business' as const) : ('global' as const),
            businessId: businessScoped ? String(rawNegocio) : null,
          };
        },
      );
      set({ categories: normalized });
    } catch (error) {
      console.error('[CategoriesStore] Error al obtener categorías', error);
      throw error;
    }
  },
  add: async (name: string, color: CategoryColor = 'brand', icon?: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('El nombre es obligatorio.');
    }

    const exists = get().categories.some(
      (category) => category.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      throw new Error('Ya existe una categoría con ese nombre.');
    }

    let negocioId: string | undefined;
    try { negocioId = activeBusiness.get() || undefined; } catch {}
    if (!negocioId) {
      const envNegocio = process.env.NEXT_PUBLIC_NEGOCIO_ID;
      if (envNegocio) negocioId = envNegocio;
    }
    if (!negocioId) {
      throw new Error('Selecciona un negocio activo antes de crear categorías.');
    }

    const created = await api.createCategory({ nombre: trimmed, negocioId });
    const rawId =
      (created as ApiCategory)?.id_categoria ?? (created as Record<string, unknown>)?.id ??
      (created as Record<string, unknown>)?.uuid ??
      uid();
    const rawNegocio = (created as ApiCategory)?.negocio_id ?? negocioId;

    const newItem: CategoryItem = {
      id: String(rawId),
      name: (created as ApiCategory)?.nombre ?? trimmed,
      color,
      icon,
      scope: rawNegocio != null ? ('business' as const) : ('global' as const),
      businessId: rawNegocio != null ? String(rawNegocio) : null,
    };

    set({ categories: [...get().categories, newItem] });
    return newItem;
  },
  update: async (id: string, patch: Partial<Pick<CategoryItem, 'name' | 'icon' | 'color'>>) => {
    const category = get().categories.find((item) => item.id === id);
    if (!category) {
      throw new Error('Categoría no encontrada.');
    }
    const updates: Partial<CategoryItem> = { ...patch };

    if (patch.name !== undefined) {
      if (category.scope === 'global') {
        throw new Error('No puedes renombrar categorías predeterminadas.');
      }
      const trimmed = patch.name.trim();
      if (!trimmed) {
        throw new Error('El nombre es obligatorio.');
      }
      await api.updateCategory(id, { nombre: trimmed });
      updates.name = trimmed;
    }

    set({
      categories: get().categories.map((category) =>
        category.id === id ? { ...category, ...updates } : category,
      ),
    });
  },
  remove: async (id: string) => {
    const category = get().categories.find((item) => item.id === id);
    if (category?.scope === 'global') {
      throw new Error('No puedes eliminar categorías predeterminadas.');
    }
    await api.deleteCategory(id);

    const next = get().categories.filter((category) => category.id !== id);
    const selected = get().selected;
    const stillExists = next.some((category) => category.name === selected);
    set({ categories: next, selected: stillExists ? selected : 'all' });
  },
  moveUp: (id: string) => {
    const items = get().categories.slice();
    const idx = items.findIndex((category) => category.id === id);
    if (idx > 0) {
      const [item] = items.splice(idx, 1);
      items.splice(idx - 1, 0, item);
      set({ categories: items });
    }
  },
  moveDown: (id: string) => {
    const items = get().categories.slice();
    const idx = items.findIndex((category) => category.id === id);
    if (idx >= 0 && idx < items.length - 1) {
      const [item] = items.splice(idx, 1);
      items.splice(idx + 1, 0, item);
      set({ categories: items });
    }
  },
  replaceAll: (items: CategoryItem[]) => set({ categories: items }),
  setSelected: (name: string) => set({ selected: name || 'all' }),
});

export const useCategoriesStore = create<CategoriesState>(categoriesStore);
