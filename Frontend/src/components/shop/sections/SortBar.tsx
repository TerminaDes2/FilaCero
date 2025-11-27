"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const sorts = ["Relevancia", "Precio más bajo", "Precio más alto", "Más inventario"] as const;

function setQuery(router: ReturnType<typeof useRouter>, params: URLSearchParams, next: Record<string, string | null>) {
  const p = new URLSearchParams(params.toString());
  Object.entries(next).forEach(([k, v]) => {
    if (v == null || v === "") p.delete(k);
    else p.set(k, v);
  });
  router.push(`?${p.toString()}`);
}

export default function SortBar() {
  const router = useRouter();
  const params = useSearchParams();
  const activeKey = params.get("sort") ?? "relevancia";
  const status = params.get("status");
  const offers = params.get("offers") === "1";

  const map: Record<(typeof sorts)[number], string> = {
    "Relevancia": "relevancia",
    "Precio más bajo": "price-asc",
    "Precio más alto": "price-desc",
    "Más inventario": "stock",
  };

  return (
    <nav className="sticky top-16 z-30 border-y border-[var(--fc-border-soft)] bg-white/85 backdrop-blur dark:border-white/10 dark:bg-[color:rgba(4,8,24,0.88)]" aria-label="Ordenar y filtrar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar flex gap-2 overflow-x-auto py-3 sm:flex-wrap sm:items-center sm:overflow-visible sm:py-2">
          {sorts.map((s) => {
            const key = map[s];
            const isActive = activeKey === key;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={isActive}
                onClick={() => setQuery(router, params, { sort: key })}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                  isActive
                    ? "bg-[var(--fc-brand-600)] text-white border-[var(--fc-brand-600)]"
                    : "bg-white text-[var(--fc-text-primary)] border-[var(--fc-border-soft)] hover:bg-slate-50 dark:bg-[color:rgba(15,23,42,0.78)] dark:text-[var(--fc-text-primary)] dark:border-white/12 dark:hover:bg-[color:rgba(15,23,42,0.68)]"
                }`}
              >
                {s}
              </button>
            );
          })}

          <div className="flex gap-2 sm:ml-auto">
            <button
              type="button"
              aria-pressed={status === "activo"}
              onClick={() => setQuery(router, params, { status: status === "activo" ? null : "activo" })}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                status === "activo"
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-[color:rgba(15,23,42,0.85)] dark:border-white/15"
                  : "bg-white text-[var(--fc-text-primary)] border-[var(--fc-border-soft)] hover:bg-slate-50 dark:bg-[color:rgba(15,23,42,0.78)] dark:text-[var(--fc-text-primary)] dark:border-white/12 dark:hover:bg-[color:rgba(15,23,42,0.68)]"
              }`}
            >
              Abiertos ahora
            </button>
            <button
              type="button"
              aria-pressed={offers}
              onClick={() => setQuery(router, params, { offers: offers ? null : "1" })}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                offers
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-[color:rgba(15,23,42,0.85)] dark:border-white/15"
                  : "bg-white text-[var(--fc-text-primary)] border-[var(--fc-border-soft)] hover:bg-slate-50 dark:bg-[color:rgba(15,23,42,0.78)] dark:text-[var(--fc-text-primary)] dark:border-white/12 dark:hover:bg-[color:rgba(15,23,42,0.68)]"
              }`}
            >
              Ofertas
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
