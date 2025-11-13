"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const sorts = ["Relevancia", "Cerca", "Entrega rápida", "Precio", "Rating"] as const;

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
    "Cerca": "near",
    "Entrega rápida": "fast",
    "Precio": "price",
    "Rating": "rating",
  };

  return (
    <nav className="sticky top-16 z-30 bg-white/80 backdrop-blur border-y border-[var(--fc-border-soft)]" aria-label="Ordenar y filtrar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 h-12">
          {sorts.map((s) => {
            const key = map[s];
            const isActive = activeKey === key;
            return (
              <button
                key={s}
                onClick={() => setQuery(router, params, { sort: key })}
                className={`px-3 h-8 rounded-full text-[12px] font-medium border transition ${
                  isActive
                    ? "bg-[var(--fc-brand-600)] text-white border-[var(--fc-brand-600)]"
                    : "bg-white text-slate-700 border-[var(--fc-border-soft)] hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setQuery(router, params, { status: status === "activo" ? null : "activo" })}
              className={`px-3 h-8 rounded-full text-[12px] font-medium border transition ${
                status === "activo"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-[var(--fc-border-soft)] hover:bg-slate-50"
              }`}
            >
              Abiertos ahora
            </button>
            <button
              onClick={() => setQuery(router, params, { offers: offers ? null : "1" })}
              className={`px-3 h-8 rounded-full text-[12px] font-medium border transition ${
                offers
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-[var(--fc-border-soft)] hover:bg-slate-50"
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
