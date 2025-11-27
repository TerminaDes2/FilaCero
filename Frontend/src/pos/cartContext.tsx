"use client";
import React, { createContext, useContext, useMemo, useReducer } from 'react';

// --- ¡CORRECCIÓN AQUÍ! ---
// Añadimos los campos de imagen que vienen de la API
export interface POSProduct {
  id: string; // Tu API lo devuelve como 'id_producto', pero el service lo mapea a 'id'
  name: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  image?: string; // Este campo parece ser el antiguo (puedes dejarlo)
  
  // --- CAMPOS AÑADIDOS ---
  // Estos campos SÍ vienen de tu API (gracias al 'mapProduct' del backend)
  imagen_url?: string | null;
  media?: Array<{
    id_media?: string;
    url: string;
    principal: boolean;
  }> | null;
  estado?: string | null; // 'activo', 'inactivo'
}
// --- FIN DE LA CORRECCIÓN ---

export interface CartItem {
  lineId: string;
  product: POSProduct; // Ahora 'product' incluye los campos de imagen
  qty: number;
  note?: string;
}

interface CartState {
  items: CartItem[];
  discount: number; // absolute value for simplicity
}

const initialState: CartState = { items: [], discount: 0 };

type Action =
  | { type: 'ADD'; product: POSProduct; qty?: number; note?: string }
  | { type: 'INC'; lineId: string }
  | { type: 'DEC'; lineId: string }
  | { type: 'REMOVE'; lineId: string }
  | { type: 'UPDATE_LINE'; lineId: string; qty?: number; note?: string }
  | { type: 'CLEAR' }
  | { type: 'SET_DISCOUNT'; value: number };

function cartReducer(state: CartState, action: Action): CartState {
  switch(action.type) {
    case 'ADD': {
      const addQty = Math.max(1, Math.floor(action.qty ?? 1));
      const normalizedNote = action.note && action.note.trim() ? action.note.trim() : undefined;
      // Merge only if same product AND same note; otherwise create a separate line
      const existingIndex = state.items.findIndex(i => i.product.id === action.product.id && i.note === normalizedNote);
      if (existingIndex >= 0) {
        const items = state.items.slice();
        const existing = items[existingIndex];
        const nextQty = Math.min(existing.qty + addQty, existing.product.stock);
        items[existingIndex] = { ...existing, qty: nextQty };
        return { ...state, items };
      }
      const newItem: CartItem = {
        lineId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,
        product: action.product,
        qty: Math.min(addQty, action.product.stock),
        note: normalizedNote
      };
      return { ...state, items: [...state.items, newItem] };
    }
    case 'UPDATE_LINE': {
      const items = state.items.slice();
      const idx = items.findIndex(i => i.lineId === action.lineId);
      if (idx < 0) return state;
      const current = items[idx];
      const normalizedNote = action.note !== undefined && action.note.trim() === '' ? undefined : (action.note?.trim() ?? current.note);
      const nextQty = action.qty !== undefined ? Math.max(1, Math.min(Math.floor(action.qty), current.product.stock)) : current.qty;
      // If another line exists with same product and same (normalized) note, merge quantities
      const otherIdx = items.findIndex((i, j) => j !== idx && i.product.id === current.product.id && i.note === normalizedNote);
      if (otherIdx >= 0) {
        const other = items[otherIdx];
        const mergedQty = Math.min(nextQty + other.qty, current.product.stock);
        items[otherIdx] = { ...other, qty: mergedQty };
        items.splice(idx, 1);
        return { ...state, items };
      }
      items[idx] = { ...current, qty: nextQty, note: normalizedNote };
      return { ...state, items };
    }
    case 'INC': {
      return { ...state, items: state.items.map(i => i.lineId === action.lineId ? { ...i, qty: Math.min(i.qty + 1, i.product.stock) } : i) };
    }
    case 'DEC': {
      return { ...state, items: state.items.flatMap(i => {
        if(i.lineId !== action.lineId) return [i];
        const next = i.qty - 1;
        return next <= 0 ? [] : [{ ...i, qty: next }];
      }) };
    }
    case 'REMOVE': return { ...state, items: state.items.filter(i => i.lineId !== action.lineId) };
    case 'CLEAR': return { ...state, items: [] };
    case 'SET_DISCOUNT': return { ...state, discount: Math.max(0, action.value) };
    default: return state;
  }
}

interface CartContextValue extends CartState {
  add: (p: POSProduct, qty?: number, note?: string) => void;
  inc: (lineId: string) => void;
  dec: (lineId: string) => void;
  remove: (lineId: string) => void;
  updateLine: (lineId: string, qty?: number, note?: string) => void;
  clear: () => void;
  setDiscount: (val: number) => void;
  subtotal: number;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const subtotal = useMemo(()=> state.items.reduce((s,i)=> s + i.product.price * i.qty, 0), [state.items]);
  // IVA excluded entirely from calculations; totals are net amounts without VAT.
  const total = useMemo(()=> Math.max(0, subtotal - state.discount), [subtotal, state.discount]);

  const value: CartContextValue = {
    ...state,
    add: (p, qty, note) => dispatch({ type:'ADD', product: p, qty, note }),
    inc: lineId => dispatch({ type:'INC', lineId }),
    dec: lineId => dispatch({ type:'DEC', lineId }),
    remove: lineId => dispatch({ type:'REMOVE', lineId }),
    updateLine: (lineId, qty, note) => dispatch({ type:'UPDATE_LINE', lineId, qty, note }),
    clear: () => dispatch({ type:'CLEAR' }),
    setDiscount: val => dispatch({ type:'SET_DISCOUNT', value: val }),
    subtotal, total
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if(!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}