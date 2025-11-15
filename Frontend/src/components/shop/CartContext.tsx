'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';

export type CartItem = {
  id: number | string;
  nombre: string;
  precio: number; // en unidades decimales
  cantidad: number;
  imagen?: string;
  id_negocio?: number | string;
};

type CartContextShape = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'cantidad'>, qty?: number) => void;
  removeFromCart: (id: CartItem['id']) => void;
  updateQty: (id: CartItem['id'], qty: number) => void;
  clearCart: () => void;
  total: number;
  open: boolean;
  toggleOpen: (v?: boolean) => void;
};

const CartContext = createContext<CartContextShape | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart_v1');
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart_v1', JSON.stringify(items));
  }, [items]);

  const addToCart = (item: Omit<CartItem, 'cantidad'>, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) => p.id === item.id ? { ...p, cantidad: p.cantidad + qty } : p);
      }
      return [...prev, { ...item, cantidad: qty }];
    });
    setOpen(true);
  };

  const removeFromCart = (id: CartItem['id']) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQty = (id: CartItem['id'], qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, cantidad: qty } : p)));
  };

  const clearCart = () => setItems([]);
  const total = items.reduce((s, it) => s + it.precio * it.cantidad, 0);

  const toggleOpen = (v?: boolean) => setOpen(v ?? ((s) => !s));

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, clearCart, total, open, toggleOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
