"use client";
import React from "react";

type CurCard = { title: string; subtitle?: string; colorFrom: string; colorTo: string };

const curations: CurCard[] = [
  { title: "2x1 Hoy", subtitle: "Solo hasta las 6pm", colorFrom: "from-rose-500", colorTo: "to-orange-500" },
  { title: "30 min garantizados", subtitle: "Entrega veloz", colorFrom: "from-emerald-500", colorTo: "to-teal-500" },
  { title: "Favoritos del barrio", subtitle: "Hecho en casa", colorFrom: "from-indigo-500", colorTo: "to-fuchsia-500" },
  { title: "Nuevos esta semana", subtitle: "Dales un vistazo", colorFrom: "from-blue-500", colorTo: "to-cyan-500" },
];

export default function Curations() {
  return (
    <section className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4">
          {curations.slice(0, 2).map((c) => (
            <button key={c.title} className={`relative overflow-hidden rounded-3xl p-6 h-40 text-left bg-gradient-to-br ${c.colorFrom} ${c.colorTo} text-white`}> 
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-black/10 blur-2xl" />
              <div className="relative">
                <div className="text-xl font-extrabold leading-tight">{c.title}</div>
                {c.subtitle && <div className="text-sm opacity-90">{c.subtitle}</div>}
              </div>
            </button>
          ))}
        </div>
        <div className="grid grid-rows-2 gap-4">
          {curations.slice(2).map((c) => (
            <button key={c.title} className={`relative overflow-hidden rounded-3xl p-6 text-left bg-gradient-to-br ${c.colorFrom} ${c.colorTo} text-white`}> 
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-black/10 blur-2xl" />
              <div className="relative">
                <div className="text-xl font-extrabold leading-tight">{c.title}</div>
                {c.subtitle && <div className="text-sm opacity-90">{c.subtitle}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
