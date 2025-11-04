import React from "react";
import { useCart } from "./CartContext";
import Link from "next/link";

export default function CartSlide() {
  const { open, toggleOpen, items, total, updateQty, removeFromCart, clearCart } = useCart();

  return (
    <>
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-[#0f172a] border-l transform transition-transform duration-300 z-40 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 flex flex-col border-b" style={{ borderColor: "var(--fc-border-soft)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tu carrito</h3>
            <button onClick={() => toggleOpen(false)} aria-label="Cerrar carrito" className="p-2 rounded hover:bg-gray-100">
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Arma tu carrito de productos.</p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 mt-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                className="w-24 h-24 mb-4 opacity-70"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="32" cy="32" r="30" stroke="#ccc" />
                <path d="M16 40c4-6 28-6 32 0M24 26h16" stroke="#aaa" strokeLinecap="round" />
              </svg>
              <p className="text-sm font-medium">No tienes productos en tu carrito</p>
            </div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 p-2 border rounded-lg hover:shadow-sm transition">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                  {it.imagen ? (
                    <img src={it.imagen} alt={it.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">Img</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{it.nombre}</div>
                    <div className="text-sm font-semibold">
                      {(it.precio * it.cantidad).toLocaleString(undefined, {
                        style: "currency",
                        currency: "MXN",
                      })}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => updateQty(it.id, it.cantidad - 1)}>
                      -
                    </button>
                    <span className="px-2">{it.cantidad}</span>
                    <button className="px-2 py-1 border rounded" onClick={() => updateQty(it.id, it.cantidad + 1)}>
                      +
                    </button>
                    <button className="ml-2 text-sm text-red-600" onClick={() => removeFromCart(it.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t" style={{ borderColor: "var(--fc-border-soft)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-lg font-bold">
                {total.toLocaleString(undefined, { style: "currency", currency: "USD" })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="fc-btn-secondary flex-1 border border-gray-300 rounded-md py-2"
                onClick={() => {
                  clearCart();
                  toggleOpen(false);
                }}
              >
                Vaciar carrito
              </button>
<button
  className="flex-1 bg-green-600 text-white rounded-md py-2 hover:bg-green-500 transition"
  onClick={() => toggleOpen(false)}
>
  <Link
    href="/checkout"
    className="block w-full h-full text-center"
  >
    Continuar
  </Link>
</button>
            </div>
          </div>
        )}
      </div>

      {/* sombreado */}
      <div
        onClick={() => toggleOpen(false)}
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      ></div>
    </>
  );
}
