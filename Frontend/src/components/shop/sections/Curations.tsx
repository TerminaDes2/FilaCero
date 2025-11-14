"use client";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CurationCard = {
  title: string;
  subtitle?: string;
  colorFrom: string;
  colorTo: string;
  action: Record<string, string>;
};

const curations: CurationCard[] = [
  {
    title: "Promos activas",
    subtitle: "Ver ofertas vigentes",
    colorFrom: "from-rose-500",
    colorTo: "to-orange-500",
    action: { offers: "1" },
  },
  {
    title: "Entrega rápida",
    subtitle: "Listos en menos de 20 min",
    colorFrom: "from-emerald-500",
    colorTo: "to-teal-500",
    action: { sort: "fast" },
  },
  {
    title: "Mejor precio",
    subtitle: "Ordenar por costo",
    colorFrom: "from-indigo-500",
    colorTo: "to-fuchsia-500",
    action: { sort: "price" },
  },
  {
    title: "Cerca de mí",
    subtitle: "Negocios en tu zona",
    colorFrom: "from-blue-500",
    colorTo: "to-cyan-500",
    action: { sort: "near" },
  },
];

function buildQuery(params: URLSearchParams, updates: Record<string, string | null>) {
  const next = new URLSearchParams(Array.from(params.entries()));
  Object.entries(updates).forEach(([key, value]) => {
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
  });
  const query = next.toString();
  return query ? `?${query}` : "?";
}

export default function Curations() {
  const router = useRouter();
  const params = useSearchParams();

  const activeMap = useMemo(() => {
    const entries = Array.from(params.entries());
    return entries.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }, [params]);

  const handleAction = useCallback((action: Record<string, string>) => {
    const isActive = Object.entries(action).every(([key, value]) => activeMap[key] === value);
    const updates: Record<string, string | null> = {};
    Object.entries(action).forEach(([key, value]) => {
      updates[key] = isActive ? null : value;
    });
    const query = buildQuery(params, updates);
    router.push(query, { scroll: false });
  }, [activeMap, params, router]);

  const isCardActive = useCallback((action: Record<string, string>) => {
    return Object.entries(action).every(([key, value]) => activeMap[key] === value);
  }, [activeMap]);

  return (
    <section className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4">
          {curations.slice(0, 2).map((c) => {
            const active = isCardActive(c.action);
            return (
            <button
              key={c.title}
              aria-pressed={active}
              onClick={() => handleAction(c.action)}
              className={`relative overflow-hidden rounded-3xl p-6 h-40 text-left bg-gradient-to-br ${c.colorFrom} ${c.colorTo} text-white transition-transform hover:translate-y-[-2px] ${active ? "ring-2 ring-white/80" : ""}`}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-black/10 blur-2xl" />
              <div className="relative">
                <div className="text-xl font-extrabold leading-tight">{c.title}</div>
                {c.subtitle && <div className="text-sm opacity-90">{c.subtitle}</div>}
              </div>
            </button>
          );})}
        </div>
        <div className="grid grid-rows-2 gap-4">
          {curations.slice(2).map((c) => {
            const active = isCardActive(c.action);
            return (
            <button
              key={c.title}
              aria-pressed={active}
              onClick={() => handleAction(c.action)}
              className={`relative overflow-hidden rounded-3xl p-6 text-left bg-gradient-to-br ${c.colorFrom} ${c.colorTo} text-white transition-transform hover:translate-y-[-2px] ${active ? "ring-2 ring-white/80" : ""}`}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-black/10 blur-2xl" />
              <div className="relative">
                <div className="text-xl font-extrabold leading-tight">{c.title}</div>
                {c.subtitle && <div className="text-sm opacity-90">{c.subtitle}</div>}
              </div>
            </button>
          );})}
        </div>
      </div>
    </section>
  );
}
