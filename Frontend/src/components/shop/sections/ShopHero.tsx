"use client";
import React from "react";

export default function ShopHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--fc-border-soft)] bg-white/70">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -left-24 w-[380px] h-[220px] rounded-full blur-3xl opacity-25" style={{ background:
          "radial-gradient(closest-side, var(--fc-brand-600), transparent)" }} />
        <div className="absolute -top-20 -right-28 w-[420px] h-[240px] rounded-full blur-3xl opacity-25" style={{ background:
          "radial-gradient(closest-side, var(--fc-teal-500), transparent)" }} />
      </div>
      <div className="relative px-6 sm:px-10 py-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Descubre, ordena y evita la fila
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Recomendaciones curadas, entregas rápidas y experiencias locales. Todo con el sello de FilaCero.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-white border border-[var(--fc-border-soft)] text-sm text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[var(--fc-brand-600)]" /> Entrega express
          </span>
          <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-white border border-[var(--fc-border-soft)] text-sm text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[var(--fc-teal-500)]" /> Favoritos locales
          </span>
          <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-white border border-[var(--fc-border-soft)] text-sm text-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Nuevos esta semana
          </span>
        </div>
      </div>
    </section>
  );
}
