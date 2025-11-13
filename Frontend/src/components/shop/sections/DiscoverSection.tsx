"use client";
import React from 'react';
import StoreCard from '../cards/StoreCard';

const demoStores = [
  { name: 'Panadería La Espiga', cover: '/images/POS-OrdenarMenu.png', categories: ['Bakery', 'Café'], eta: '20–30 min', rating: 4.8, price: '$' },
  { name: 'Tacos El Primo', cover: '/images/POS-OrdenarMenu.png', categories: ['Mexicana'], eta: '25–35 min', rating: 4.6, price: '$' },
  { name: 'Green Bowl', cover: '/images/POS-OrdenarMenu.png', categories: ['Healthy'], eta: '30–40 min', rating: 4.7, price: '$$' },
  { name: 'Sushi Kaze', cover: '/images/POS-OrdenarMenu.png', categories: ['Sushi'], eta: '35–45 min', rating: 4.5, price: '$$' },
  { name: 'Pizzería Nova', cover: '/images/POS-OrdenarMenu.png', categories: ['Pizza'], eta: '20–30 min', rating: 4.4, price: '$' },
  { name: 'Café Aurora', cover: '/images/POS-OrdenarMenu.png', categories: ['Café', 'Postres'], eta: '10–20 min', rating: 4.9, price: '$' },
];

const chips = ['Promos', 'Cerca de ti', 'Favoritos', 'En 30 min', 'Recomendados', 'Top rating', 'Veggie', 'Postres'];

export default function DiscoverSection() {
  return (
    <section className="w-full">
      {/* Chips */}
      <div className="no-scrollbar relative -mx-2 px-2 overflow-x-auto">
        <div className="flex gap-2 py-2">
          {chips.map((c) => (
            <button
              key={c}
              className="px-3 h-8 inline-flex items-center rounded-full text-[12px] font-medium border border-[var(--fc-border-soft)] bg-white hover:bg-slate-50"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {demoStores.map((s, i) => (
          <StoreCard key={i} {...s} />
        ))}
      </div>
    </section>
  );
}
