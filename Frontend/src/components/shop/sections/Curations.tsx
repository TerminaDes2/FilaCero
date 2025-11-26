"use client";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CurationCard = {
  title: string;
  subtitle?: string;
  colorFrom: string;
  colorTo: string;
  action?: Record<string, string>;
  clearKeys?: string[];
};

const curations: CurationCard[] = [
  {
    title: "Catálogo completo",
    subtitle: "Ver productos sin filtros",
    colorFrom: "from-[var(--fc-brand-500)]",
    colorTo: "to-[var(--fc-teal-500)]",
    clearKeys: ["offers", "sort", "status", "categoria"],
  },
  {
    title: "Ofertas visibles",
    subtitle: "Detectamos títulos con promo",
    colorFrom: "from-rose-500",
    colorTo: "to-orange-500",
    action: { offers: "1" },
  },
  {
    title: "Abiertos ahora",
    subtitle: "Productos con estado activo",
    colorFrom: "from-emerald-500",
    colorTo: "to-teal-500",
    action: { status: "activo" },
  },
  {
    title: "Sin categoría",
    subtitle: "Listado para clasificar",
    colorFrom: "from-indigo-500",
    colorTo: "to-fuchsia-500",
    action: { categoria: "__none__" },
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

  const computeActive = useCallback((card: CurationCard) => {
    const actionEntries = Object.entries(card.action ?? {});
    const clearsSatisfied = card.clearKeys ? card.clearKeys.every((key) => !(key in activeMap)) : true;
    const actionSatisfied = actionEntries.every(([key, value]) => activeMap[key] === value);
    return clearsSatisfied && actionSatisfied;
  }, [activeMap]);

  const handleCard = useCallback((card: CurationCard) => {
    const active = computeActive(card);
    const updates: Record<string, string | null> = {};

    if (card.clearKeys) {
      card.clearKeys.forEach((key) => {
        updates[key] = null;
      });
    }

    if (card.action) {
      Object.entries(card.action).forEach(([key, value]) => {
        updates[key] = active ? null : value;
      });
    }

    // Avoid pushing the same URL if nothing changes
    const query = buildQuery(params, updates);
    const current = params.toString();
    const next = query === "?" ? "" : query.slice(1);
    if (next === current) {
      return;
    }
    router.push(next ? `?${next}` : "?", { scroll: false });
  }, [computeActive, params, router]);

  return (
    <section className="mt-6 hidden sm:block">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {curations.map((card) => {
          const active = computeActive(card);
          return (
            <button
              key={card.title}
              type="button"
              aria-pressed={active}
              onClick={() => handleCard(card)}
              className={`relative overflow-hidden rounded-3xl p-6 min-h-[156px] text-left bg-gradient-to-br ${card.colorFrom} ${card.colorTo} text-white transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${active ? "ring-2 ring-white/80" : ""}`}
            >
              <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-black/10 blur-2xl" />
              <div className="relative space-y-2">
                <div className="text-lg font-extrabold leading-tight sm:text-xl">{card.title}</div>
                {card.subtitle && <div className="text-sm font-medium text-white/90">{card.subtitle}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
