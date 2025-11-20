"use client";
import React from "react";
import Image from "next/image";

type Card = {
  name: string;
  cover?: string;
  tag?: string;
  meta?: string;
  href?: string;
  tall?: boolean;
};

const demo: Card[] = [
  { name: "Mercado Río", cover: "/images/POS-OrdenarMenu.png", tag: "Local", meta: "15–25 min • $$", tall: false },
  { name: "Dolci Postres", cover: "/images/POS-OrdenarMenu.png", tag: "Sweet", meta: "20–30 min • $", tall: true },
  { name: "Bao House", cover: "/images/POS-OrdenarMenu.png", tag: "Nuevo", meta: "25–35 min • $$", tall: false },
  { name: "Verde Vivo", cover: "/images/POS-OrdenarMenu.png", tag: "Veggie", meta: "30–40 min • $$", tall: true },
  { name: "Café Origen", cover: "/images/POS-OrdenarMenu.png", tag: "Café", meta: "10–20 min • $", tall: false },
  { name: "Sushi Kaze", cover: "/images/POS-OrdenarMenu.png", tag: "Sushi", meta: "35–45 min • $$", tall: true },
  { name: "Pizzería Nova", cover: "/images/POS-OrdenarMenu.png", tag: "Pizza", meta: "20–30 min • $", tall: false },
  { name: "Barra Brava", cover: "/images/POS-OrdenarMenu.png", tag: "Rápido", meta: "15–25 min • $", tall: false },
];

export default function MasonryFeed() {
  return (
    <section className="mt-6" aria-label="Explorar tiendas y productos">
      <div className="columns-1 sm:columns-2 xl:columns-3 gap-4 [column-fill:_balance]"></div>
      <div className="columns-1 sm:columns-2 xl:columns-3 gap-4">
        {demo.map((c, i) => (
          <article key={i} className="mb-4 break-inside-avoid">
            <MasonryCard {...c} />
          </article>
        ))}
      </div>
    </section>
  );
}

function MasonryCard({ name, cover, tag, meta, href = "#", tall }: Card) {
  return (
    <a href={href} className="group block rounded-3xl overflow-hidden border border-[var(--fc-border-soft)] bg-white/80 hover:shadow-md transition">
      <div className={`relative ${tall ? "h-64" : "h-40"} bg-slate-100`}>
        {cover ? (
          <Image src={cover} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-slate-400 text-sm">Sin imagen</div>
        )}
        {tag && (
          <span className="absolute left-3 top-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white bg-slate-900/80">
            {tag}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">{name}</h3>
        </div>
        {meta && <div className="mt-1 text-[12px] text-slate-500 line-clamp-1">{meta}</div>}
      </div>
    </a>
  );
}
