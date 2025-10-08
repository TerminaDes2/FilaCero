import React from 'react';
import { useCart } from './CartContext';

export default function CartSlide() {
  const { open, toggleOpen, items, total, updateQty, removeFromCart, clearCart } = useCart();

  const handleCheckout = async () => {
    // Llamada al endpoint de checkout
    try {
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw res;
      const data = await res.json();
      // redirigir a pagina de cobro /success
      window.location.href = `/checkout?ventaId=${data.id_venta ?? ''}`;
    } catch (err) {
      console.error('checkout failed', err);
      alert('Error al procesar el pago. Intenta más tarde.');
    }
  };

  return (
    <>
      <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-[#0f172a] border-l transform transition-transform duration-300 z-40 ${open ? 'translate-x-0' : 'translate-x-full'}`} style={{ borderColor: 'var(--fc-border-soft)' }}>
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--fc-border-soft)' }}>
          <h3 className="text-lg font-semibold">Tu carrito</h3>
          <div className="flex items-center gap-2">
            <div className="font-bold">{total.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
            <button onClick={() => toggleOpen(false)} aria-label="Cerrar carrito" className="p-2 rounded hover:bg-gray-100">
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">No hay productos en el carrito.</div>
          ) : items.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                {it.imagen ? <img src={it.imagen} alt={it.nombre} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">Img</div>}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{it.nombre}</div>
                  <div className="text-sm font-semibold">{(it.precio * it.cantidad).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button className="px-2 py-1 border rounded" onClick={() => updateQty(it.id, it.cantidad - 1)}>-</button>
                  <span className="px-2">{it.cantidad}</span>
                  <button className="px-2 py-1 border rounded" onClick={() => updateQty(it.id, it.cantidad + 1)}>+</button>
                  <button className="ml-2 text-sm text-red-600" onClick={() => removeFromCart(it.id)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t" style={{ borderColor: 'var(--fc-border-soft)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-lg font-bold">{total.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
          </div>
          <div className="flex gap-2">
            <button className="fc-btn-secondary flex-1" onClick={() => { clearCart(); toggleOpen(false); }}>
              Vaciar carrito
            </button>
            <button className="fc-btn-primary flex-1" style={{ background: 'var(--pos-accent-green)' }} onClick={handleCheckout}>
              Verificar
            </button>
          </div>
        </div>
      </div>

      {/* sombreado */}
      <div onClick={() => toggleOpen(false)} className={`fixed inset-0 bg-black/30 z-30 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}></div>
    </>
  );
}
