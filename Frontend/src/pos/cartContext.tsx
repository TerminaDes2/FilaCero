"use client";
import React, { createContext, useContext, useMemo, useReducer } from 'react';

export interface POSProduct {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  image?: string; // url or static path
}

export interface CartItem {
  product: POSProduct;
  qty: number;
}

interface CartState {
  items: CartItem[];
  discount: number; // absolute value for simplicity
}

const initialState: CartState = { items: [], discount: 0 };

type Action =
  | { type: 'ADD'; product: POSProduct }
  | { type: 'INC'; id: string }
  | { type: 'DEC'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' }
  | { type: 'SET_DISCOUNT'; value: number };

function cartReducer(state: CartState, action: Action): CartState {
  switch(action.type) {
    case 'ADD': {
      const existing = state.items.find(i => i.product.id === action.product.id);
      if(existing) {
        return { ...state, items: state.items.map(i => i.product.id === action.product.id ? { ...i, qty: Math.min(i.qty + 1, i.product.stock) } : i) };
      }
      return { ...state, items: [...state.items, { product: action.product, qty: 1 }] };
    }
    case 'INC': {
      return { ...state, items: state.items.map(i => i.product.id === action.id ? { ...i, qty: Math.min(i.qty + 1, i.product.stock) } : i) };
    }
    case 'DEC': {
      return { ...state, items: state.items.flatMap(i => {
        if(i.product.id !== action.id) return [i];
        const next = i.qty - 1;
        return next <= 0 ? [] : [{ ...i, qty: next }];
      }) };
    }
    case 'REMOVE': return { ...state, items: state.items.filter(i => i.product.id !== action.id) };
    case 'CLEAR': return { ...state, items: [] };
    case 'SET_DISCOUNT': return { ...state, discount: Math.max(0, action.value) };
    default: return state;
  }
}

interface CartContextValue extends CartState {
  add: (p: POSProduct) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  setDiscount: (val: number) => void;
  subtotal: number;
  iva: number; // 16%
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const subtotal = useMemo(()=> state.items.reduce((s,i)=> s + i.product.price * i.qty, 0), [state.items]);
  const iva = useMemo(()=> subtotal * 0.16, [subtotal]);
  const total = useMemo(()=> Math.max(0, subtotal - state.discount + iva), [subtotal, state.discount, iva]);

  const value: CartContextValue = {
    ...state,
    add: p => dispatch({ type:'ADD', product: p }),
    inc: id => dispatch({ type:'INC', id }),
    dec: id => dispatch({ type:'DEC', id }),
    remove: id => dispatch({ type:'REMOVE', id }),
    clear: () => dispatch({ type:'CLEAR' }),
    setDiscount: val => dispatch({ type:'SET_DISCOUNT', value: val }),
    subtotal, iva, total
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if(!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
