"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Story = { title: string; color: string; emoji?: string };

const stories: Story[] = [
  { title: "Panaderías", color: "from-rose-500 to-pink-500", emoji: "🥐" },
  { title: "Café", color: "from-amber-500 to-orange-500", emoji: "☕" },
  { title: "Sushi", color: "from-cyan-500 to-blue-500", emoji: "🍣" },
  { title: "Veggie", color: "from-emerald-500 to-teal-500", emoji: "🥗" },
  { title: "Postres", color: "from-fuchsia-500 to-violet-500", emoji: "🍰" },
  { title: "Local", color: "from-green-500 to-lime-500", emoji: "🏪" },
  { title: "Rápido", color: "from-red-500 to-rose-500", emoji: "⚡" },
];

function setQuery(router: ReturnType<typeof useRouter>, params: URLSearchParams, next: Record<string, string | null>) {
  const p = new URLSearchParams(params.toString());
  Object.entries(next).forEach(([k, v]) => {
    if (v == null || v === "") p.delete(k);
    else p.set(k, v);
  });
  router.push(`?${p.toString()}`);
}

export default function StoryRail() {
  const router = useRouter();
  const params = useSearchParams();
  const activeSearch = (params.get("search") ?? "").toLowerCase();
  return (
    <section className="mt-5" aria-label="Accesos rápidos">
      <nav className="-mx-2 overflow-x-auto no-scrollbar" aria-label="Categorías destacadas">
        <div className="flex gap-4 px-2 py-2">
          {stories.map((s) => {
            const val = s.title.toLowerCase();
            const isActive = activeSearch === val;
            return (
            <button
              aria-label={s.title}
              key={s.title}
              onClick={() => setQuery(router, params, { search: isActive ? null : val })}
              className={`group inline-flex flex-col items-center w-20 shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-xl ${isActive ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
            >
              <span className={`relative grid place-items-center w-16 h-16 rounded-full bg-gradient-to-br ${s.color} p-0.5`}> 
                <span className="absolute inset-0 rounded-full opacity-30 blur-md bg-white" />
                <span className="relative w-full h-full rounded-full grid place-items-center bg-white text-xl">
                  {s.emoji ?? "✦"}
                </span>
              </span>
              <span className="mt-2 text-[12px] text-slate-700 font-medium truncate w-full text-center">
                {s.title}
              </span>
            </button>
          );})}
        </div>
      </nav>
    </section>
  );
}
