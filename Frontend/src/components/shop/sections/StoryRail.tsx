"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../lib/api";

type CatalogCategory = {
  id: string | null;
  nombre: string;
  totalProductos: number;
  value: string;
};

const gradients = [
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-fuchsia-500 to-violet-500",
  "from-green-500 to-lime-500",
  "from-red-500 to-rose-500",
  "from-indigo-500 to-sky-500",
];

function buildParams(params: URLSearchParams, next: Record<string, string | null>) {
  const updated = new URLSearchParams(Array.from(params.entries()));
  Object.entries(next).forEach(([key, value]) => {
    if (value == null || value === "") updated.delete(key);
    else updated.set(key, value);
  });
  const query = updated.toString();
  return query ? `?${query}` : "?";
}

export default function StoryRail() {
  const router = useRouter();
  const params = useSearchParams();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const activeCategoria = params.get("categoria") ?? "";

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      let negocioId: string | undefined;
      try {
        negocioId =
          typeof window !== "undefined"
            ? localStorage.getItem("active_business_id") || undefined
            : undefined;
      } catch {}
      if (!negocioId) {
        const envBiz = (globalThis as any).process?.env?.NEXT_PUBLIC_NEGOCIO_ID as string | undefined;
        if (envBiz && envBiz.trim()) {
          negocioId = envBiz.trim();
        }
      }
      const data = await api.getProductCategories(negocioId ? { id_negocio: negocioId } : undefined);
      if (!mountedRef.current) return;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[StoryRail] Error cargando categorías", error);
      if (!mountedRef.current) return;
      setCategories([]);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchCategories();
    };
    load();

    const handleRefresh = () => {
      fetchCategories();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("shop:catalog-refresh", handleRefresh);
      const snapshotListener = (event: Event) => {
        const custom = event as CustomEvent<CatalogCategory[]>;
        if (!Array.isArray(custom.detail)) return;
        if (!mountedRef.current) return;
        setCategories(custom.detail);
        setLoading(false);
      };
      window.addEventListener("shop:categories-snapshot", snapshotListener as EventListener);
      return () => {
        window.removeEventListener("shop:catalog-refresh", handleRefresh);
        window.removeEventListener("shop:categories-snapshot", snapshotListener as EventListener);
      };
    }

    return () => {};
  }, [fetchCategories]);

  const handleSelect = useCallback((value: string | null) => {
    const query = buildParams(params, { categoria: value });
    router.push(query, { scroll: false });
  }, [params, router]);

  const chips = useMemo(() => {
    if (categories.length === 0) {
      return [] as Array<CatalogCategory & { gradient: string }>;
    }
    return categories.map((category, index) => ({
      ...category,
      gradient: gradients[index % gradients.length],
    }));
  }, [categories]);

  return (
    <section className="mt-5" aria-label="Accesos rápidos">
      <nav className="-mx-2 overflow-x-auto no-scrollbar" aria-label="Categorías destacadas">
        <div className="flex gap-4 px-2 py-2">
          <button
            key="all"
            onClick={() => handleSelect(null)}
            aria-pressed={activeCategoria === ""}
            className={`inline-flex flex-col items-center w-20 shrink-0 rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white transition ${activeCategoria === "" ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
          >
            <span className="relative grid place-items-center w-16 h-16 rounded-full bg-white border border-[var(--fc-border-soft)]">
              <span className="text-lg font-semibold text-slate-700">All</span>
            </span>
            <span className="mt-2 text-[12px] text-slate-700 font-medium truncate w-full text-center">
              Todo
            </span>
          </button>

          {loading && chips.length === 0 && (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="w-20 shrink-0">
                <div className="w-16 h-16 rounded-full bg-slate-100 animate-pulse mx-auto" />
                <div className="h-3 mt-2 rounded-full bg-slate-100 animate-pulse" />
              </div>
            ))
          )}

          {!loading && chips.length === 0 && (
            <div className="text-xs text-slate-500 py-4">Aún no hay categorías con productos.</div>
          )}

          {chips.map((chip) => {
            const isActive = activeCategoria === chip.value;
            return (
              <button
                key={chip.value}
                aria-pressed={isActive}
                onClick={() => handleSelect(isActive ? null : chip.value)}
                className={`group inline-flex flex-col items-center w-20 shrink-0 rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white transition ${isActive ? "opacity-100" : "opacity-90 hover:opacity-100"}`}
              >
                <span className={`relative grid place-items-center w-16 h-16 rounded-full bg-gradient-to-br ${chip.gradient} p-0.5`}>
                  <span className="absolute inset-0 rounded-full opacity-30 blur-md bg-white" />
                  <span className="relative w-full h-full rounded-full grid place-items-center bg-white text-[13px] font-semibold text-slate-800">
                    {chip.nombre.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="absolute -bottom-1 right-1 px-1.5 py-0.5 rounded-full bg-white text-[10px] font-semibold text-slate-700 shadow-sm">
                    {chip.totalProductos}
                  </span>
                </span>
                <span className="mt-2 text-[12px] text-slate-700 font-medium truncate w-full text-center">
                  {chip.nombre}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </section>
  );
}
