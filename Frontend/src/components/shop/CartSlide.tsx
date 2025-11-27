"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useCart } from "./CartContext";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default function CartSlide() {
  const { open, toggleOpen, items, total, updateQty, removeFromCart, clearCart } = useCart();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mq.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
    // Fallback for older browsers (Safari < 14)
    mq.addListener(listener);
    return () => mq.removeListener(listener);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);
  const count = items.reduce((s, i) => s + i.cantidad, 0);

  const header = (
    <div className="border-b border-[var(--fc-border-soft)] bg-white/95 px-4 pt-4 pb-3 transition-colors sm:px-5 dark:border-white/12 dark:bg-[color:rgba(6,10,22,0.94)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--fc-brand-600)] text-white shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4" /><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /></svg>
          </span>
          <div>
            <h3 className="text-base font-semibold leading-tight text-slate-900 dark:text-white">Tu pedido</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">{count} {count === 1 ? 'artículo' : 'artículos'}</p>
          </div>
        </div>
        <button onClick={() => toggleOpen(false)} aria-label="Cerrar carrito" className="rounded-full p-2 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </div>
  );

  const heightClass = isMobile ? "max-h-[50vh]" : "max-h-[58vh]";
  const itemsContainerClass = `px-4 sm:px-5 py-4 overflow-y-auto space-y-3 ${heightClass}`;

  const itemsContent = (
    <div className={`${itemsContainerClass} text-slate-900 transition-colors dark:text-slate-100`}>
      {items.length === 0 ? (
        <div className="mt-8 text-center text-gray-500 transition-colors dark:text-slate-300">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--fc-border-soft)] bg-gradient-to-br from-[var(--fc-teal-50)] to-[var(--fc-brand-50)] transition-colors dark:border-white/12 dark:bg-[color:rgba(12,18,32,0.72)]">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400 transition-colors dark:text-slate-400"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4" /><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /></svg>
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700 transition-colors dark:text-white">Tu carrito está vacío</p>
          <p className="text-xs text-gray-500 transition-colors dark:text-white/60">Empieza agregando productos deliciosos.</p>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="group rounded-xl border border-[var(--fc-border-soft)] bg-white/90 px-3 py-2.5 shadow-sm transition hover:bg-white dark:border-white/12 dark:bg-[color:rgba(8,13,24,0.88)] dark:hover:bg-[color:rgba(13,19,33,0.94)]">
            <div className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-white/10">
                {item.imagen ? (
                  <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="64px" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-400 transition-colors dark:text-white/45">Sin imagen</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold leading-snug text-slate-900 dark:text-white" title={item.nombre}>{item.nombre}</p>
                  <span className="whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{currencyFormatter.format(item.precio * item.cantidad)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="inline-flex items-center rounded-full border border-[var(--fc-border-soft)] transition-colors dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.35)]">
                    <button className="flex h-7 w-7 items-center justify-center rounded-l-full text-slate-700 hover:bg-slate-50 dark:text-white/80 dark:hover:bg-white/10" onClick={() => updateQty(item.id, item.cantidad - 1)} aria-label="Restar">
                      −
                    </button>
                    <span className="w-8 select-none text-center text-sm font-medium text-slate-900 dark:text-white">{item.cantidad}</span>
                    <button className="flex h-7 w-7 items-center justify-center rounded-r-full bg-[var(--fc-brand-600)] text-white hover:bg-[var(--fc-brand-500)] dark:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)]" onClick={() => updateQty(item.id, item.cantidad + 1)} aria-label="Sumar">
                      +
                    </button>
                  </div>
                  <button className="ml-1 text-[12px] text-gray-500 transition hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400" onClick={() => removeFromCart(item.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const footer = (
    <div className="sticky bottom-0 border-t border-[var(--fc-border-soft)] bg-white/92 px-4 pb-5 pt-3 backdrop-blur-xl transition-colors sm:px-5 dark:border-white/10 dark:bg-[color:rgba(5,8,18,0.96)]">
      {items.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 transition-colors dark:text-slate-400">Total</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{currencyFormatter.format(total)}</span>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 h-10 rounded-lg border border-[var(--fc-border-soft)] text-sm font-medium transition hover:bg-slate-50 dark:border-white/12 dark:text-white/80 dark:hover:bg-white/5"
              onClick={() => { clearCart(); toggleOpen(false); }}
            >
              Vaciar
            </button>
            <Link
              href="/checkout"
              onClick={() => toggleOpen(false)}
              className="flex-1 inline-flex h-10 items-center justify-center rounded-lg bg-[var(--fc-brand-600)] text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fc-brand-500)] dark:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)]"
            >
              Pagar ahora
            </Link>
          </div>
          <p className="text-[11px] text-gray-500 transition-colors dark:text-white/50">Impuestos incluidos donde aplique.</p>
        </div>
      ) : (
        <div className="text-center text-xs text-gray-500 transition-colors dark:text-white/60">Añade productos para poder pagar.</div>
      )}
    </div>
  );

  return (
    <>
      {/* Drawer for desktop */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 hidden w-full max-w-[92vw] transform rounded-none border-l border-[var(--fc-border-soft)] bg-white/95 shadow-xl backdrop-blur-xl transition-transform duration-300 sm:block sm:w-[420px] sm:rounded-tl-3xl sm:rounded-bl-3xl dark:border-white/12 dark:bg-[color:rgba(4,7,16,0.98)] dark:shadow-[0_40px_120px_-60px_rgba(2,4,10,0.92)] ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-label="Carrito"
        aria-modal="true"
      >
        {header}
        {itemsContent}
        {footer}
      </aside>

      {/* Modal for mobile */}
      {isMobile && (
        <div
          className={`fixed inset-0 z-40 flex items-end justify-center px-3 pb-6 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Carrito"
        >
          <div className={`w-full max-w-md transform transition-all duration-300 ${open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
            <div className="overflow-hidden rounded-3xl border border-[var(--fc-border-soft)] bg-white shadow-[0_24px_55px_-28px_rgba(15,23,42,0.75)] dark:border-white/12 dark:bg-[color:rgba(5,8,18,0.98)] dark:shadow-[0_38px_120px_-65px_rgba(2,4,10,0.95)]">
              {header}
              {itemsContent}
              {footer}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div
        onClick={() => toggleOpen(false)}
        className={`fixed inset-0 z-30 bg-black/30 transition-opacity dark:bg-black/60 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
    </>
  );
}
