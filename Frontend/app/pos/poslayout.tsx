// En Frontend/src/app/pos/layout.tsx

import { CartProvider } from '../../pos/lib/state/cartContext'; // Ajusta la ruta si es necesario

export default function POSLayout({ children }: { children: React.ReactNode }) {
  // Puede que tengas otros providers aquí, lo importante es que CartProvider envuelva a children
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}