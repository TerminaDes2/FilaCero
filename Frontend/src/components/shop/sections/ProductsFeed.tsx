"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { api } from "../../../lib/api";

type Media = { url?: string; principal?: boolean; tipo?: string | null };
type Product = {
  id_producto: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  category?: string | null;
  imagen_url?: string | null;
  media?: Media[];
  popularity?: number;
  stock?: number | null;
};

function principalImage(p: Product): string | undefined {
  const m = (p.media ?? []).find((it) => it.principal && it.url);
  if (m?.url) return m.url;
  if (p.imagen_url) return p.imagen_url;
  return undefined;
}

function priceLabel(v: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  } catch {
    return `$${Math.round(v)}`;
  }
}

export default function ProductsFeed() {
  const params = useSearchParams();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(12);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Fetch products when filters change
  useEffect(() => {
    let mounted = true;
    const search = params.get("search") ?? undefined;
    const status = params.get("status") ?? undefined;
    setLoading(true);
    setVisible(12);
    api.getProducts({ search, status })
      .then((data) => {
        if (!mounted) return;
        setItems(data as any as Product[]);
        setError(null);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message ?? "Error al cargar productos");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [params]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisible((v) => v + 12);
        }
      }
    }, { rootMargin: "400px 0px 400px 0px" });
    ob.observe(el);
    return () => ob.disconnect();
  }, [sentinelRef.current]);

  const cards = useMemo(() => {
    // client-side extra filters and sort
    const offers = params.get("offers") === "1";
    const sortKey = params.get("sort") ?? "relevancia";
    let arr = [...items];
    if (offers) {
      const hasOffer = (s?: string | null) => s ? /ofert|promo/i.test(s) : false;
      arr = arr.filter((p) => hasOffer(p.nombre) || hasOffer(p.descripcion));
    }
    // sorting
    arr.sort((a, b) => {
      if (sortKey === "price") return a.precio - b.precio;
      if (sortKey === "rating") return 0; // not available; keep stable
      if (sortKey === "near") return 0; // placeholder
      if (sortKey === "fast") return 0; // placeholder
      const pa = a.popularity ?? 0;
      const pb = b.popularity ?? 0;
      return pb - pa;
    });

    return arr.map((p) => ({
      id: p.id_producto,
      name: p.nombre,
      cover: principalImage(p),
      tag: p.category ?? undefined,
      meta: [priceLabel(p.precio), p.stock != null ? `${p.stock} en stock` : undefined]
        .filter(Boolean)
        .join(" • "),
      tall: (p.popularity ?? 0) > 20, // sutil variación visual por popularidad
    }));
  }, [items, params]);

  if (loading) {
    return (
      <section className="mt-6" aria-label="Productos">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl h-40 bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6" aria-label="Productos">
        <div className="text-sm text-red-600">{error}</div>
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section className="mt-6" aria-label="Productos">
        <div className="text-sm text-slate-500">No hay productos disponibles.</div>
      </section>
    );
  }

  return (
    <section className="mt-6" aria-label="Productos">
      <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
        {cards.slice(0, visible).map((c) => (
          <article key={c.id} className="mb-4 break-inside-avoid">
            <a href={`#/producto/${c.id}`} className="group block rounded-3xl overflow-hidden border border-[var(--fc-border-soft)] bg-white/80 hover:shadow-md transition">
              <div className={`relative ${c.tall ? "h-64" : "h-40"} bg-slate-100`}>
                {c.cover ? (
                  <Image src={c.cover} alt={c.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-slate-400 text-sm">Sin imagen</div>
                )}
                {c.tag && (
                  <span className="absolute left-3 top-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white bg-slate-900/80">
                    {c.tag}
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">{c.name}</h3>
                </div>
                {c.meta && <div className="mt-1 text-[12px] text-slate-500 line-clamp-1">{c.meta}</div>}
              </div>
            </a>
          </article>
        ))}
      </div>
      <div ref={sentinelRef} />
    </section>
  );
}
