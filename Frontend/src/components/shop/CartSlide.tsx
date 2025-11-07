"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { useCart } from "./CartContext";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default function CartSlide() {
  const { open, toggleOpen, items, total, updateQty, removeFromCart, clearCart } = useCart();

  return (
    <>
      <div
        className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white dark:bg-[#0f172a] border-l transform transition-transform duration-300 z-40 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
  <div className="p-4 flex flex-col border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tu carrito</h3>
            <button onClick={() => toggleOpen(false)} aria-label="Cerrar carrito" className="p-2 rounded hover:bg-gray-100">
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Arma tu carrito de productos.</p>
        </div>

  <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
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
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 border rounded-lg hover:shadow-sm transition">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 relative">
                  {item.imagen ? (
                    <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="64px" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Sin imagen</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.nombre}</span>
                    <span className="text-sm font-semibold">{currencyFormatter.format(item.precio * item.cantidad)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => updateQty(item.id, item.cantidad - 1)}>
                      -
                    </button>
                    <span className="px-2">{item.cantidad}</span>
                    <button className="px-2 py-1 border rounded" onClick={() => updateQty(item.id, item.cantidad + 1)}>
                      +
                    </button>
                    <button className="ml-2 text-sm text-red-600" onClick={() => removeFromCart(item.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-bold">{currencyFormatter.format(total)}</span>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-100 transition"
                onClick={() => {
                  clearCart();
                  toggleOpen(false);
                }}
              >
                Vaciar carrito
              </button>
              <Link
                href="/checkout"
                onClick={() => toggleOpen(false)}
                className="flex-1 bg-green-600 text-white rounded-md py-2 text-center font-semibold hover:bg-green-500 transition"
              >
                Continuar
              </Link>
            </div>
          </div>
        )}
      </div>

      <div
        onClick={() => toggleOpen(false)}
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      ></div>
    </>
  );
}
