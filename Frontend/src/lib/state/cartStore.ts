// En /lib/state/cartStore.ts
import { create } from 'zustand';

// Definimos cómo se verá un producto dentro del carrito
export interface CartItem {
  id: string;       // El id del producto
  nombre: string;
  precio: number;
  cantidad: number;
}

// Definimos el estado y las acciones del store
interface CartState {
  items: CartItem[];
  addToCart: (product: { id: string; nombre: string; precio: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, cantidad: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  // Acción para añadir un producto al carrito
  addToCart: (product) => {
    const cart = get().items;
    const itemExistente = cart.find(item => item.id === product.id);

    if (itemExistente) {
      // Si el producto ya está, solo incrementamos la cantidad
      const updatedCart = cart.map(item =>
        item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
      );
      set({ items: updatedCart });
    } else {
      // Si es un producto nuevo, lo añadimos con cantidad 1
      const newItem = { ...product, cantidad: 1 };
      set({ items: [...cart, newItem] });
    }
  },

  // Acción para eliminar un producto del carrito
  removeFromCart: (productId) => {
    set({ items: get().items.filter(item => item.id !== productId) });
  },

  // Acción para actualizar la cantidad de un producto
  updateQuantity: (productId, cantidad) => {
    if (cantidad <= 0) {
      // Si la cantidad es 0 o menos, lo eliminamos
      get().removeFromCart(productId);
    } else {
      set({
        items: get().items.map(item =>
          item.id === productId ? { ...item, cantidad } : item
        ),
      });
    }
  },

  // Acción para vaciar el carrito
  clearCart: () => set({ items: [] }),
}));