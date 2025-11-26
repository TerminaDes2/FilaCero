"use client";
import Link from "next/link";
import React from "react";

const featureChips = [
  "Menú siempre vivo",
  "Pagos cashless",
  "Retiro cronometrado",
  "Alertas instantáneas",
];

const floatingPanels = [
  {
    title: "Explora y antoja",
    detail: "Swipe entre categorías y promos recién publicadas.",
    gradient: "from-[var(--fc-brand-500)] to-[var(--fc-teal-500)]",
    position: "-top-6 right-5",
  },
  {
    title: "Confirma sin filas",
    detail: "Todo queda listo antes de salir de casa.",
    gradient: "from-fuchsia-500 to-violet-500",
    position: "top-32 -left-10",
  },
  {
    title: "Llegas y recoges",
    detail: "El equipo marca listo y tú solo dices hola.",
    gradient: "from-amber-500 to-orange-500",
    position: "bottom-4 right-6",
  },
];

const journeyCards = [
  {
    label: "01",
    title: "Descubre",
    body: "Historias visuales, playlists de temporada y favoritos del staff.",
    accent: "from-rose-500/80 to-orange-400/80",
  },
  {
    label: "02",
    title: "Construye",
    body: "Carrito dinámico con combos, notas y extras que aparecen al momento.",
    accent: "from-cyan-500/80 to-sky-400/80",
  },
  {
    label: "03",
    title: "Retira",
    body: "Notificaciones en tu móvil cuando tu pedido pasa a listo.",
    accent: "from-emerald-500/80 to-teal-400/80",
  },
];

export default function ShopHero() {
  return (
    <section className="relative mt-2 overflow-hidden rounded-[56px] border border-[var(--fc-border-soft)] bg-[radial-gradient(1400px_480px_at_-18%_-60%,rgba(222,53,95,0.23),transparent_70%),radial-gradient(1200px_460px_at_120%_-40%,rgba(33,197,176,0.25),transparent_70%),linear-gradient(120deg,rgba(255,255,255,0.82),rgba(255,255,255,0.92))] shadow-[0_42px_120px_-62px_rgba(15,23,42,0.58)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-6 top-6 h-56 w-56 rounded-[42%] bg-white/55 blur-3xl" aria-hidden />
        <div className="absolute right-10 top-10 h-48 w-72 rotate-12 rounded-[50%] bg-[var(--fc-brand-200)]/40 blur-[100px]" aria-hidden />
        <div className="absolute left-1/3 top-16 h-16 w-16 rotate-6 rounded-full border border-white/70 bg-white/70" aria-hidden />
        <div className="absolute right-14 bottom-20 h-14 w-14 -rotate-6 rounded-full border border-white/70 bg-white/70" aria-hidden />
        <div className="absolute left-10 bottom-10 h-12 w-32 rounded-full bg-[var(--fc-teal-200)]/40 blur-2xl" aria-hidden />
        <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-[46%] bg-[var(--fc-teal-200)]/30 blur-[120px]" aria-hidden />
        <div className="absolute top-20 left-1/2 h-32 w-32 -translate-x-1/2 rounded-[40%] bg-gradient-to-br from-white/60 to-transparent" aria-hidden />
      </div>

      <div className="relative grid gap-14 px-6 py-14 sm:px-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--fc-brand-600)]">
            FilaCero Shop
          </span>
          <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-[3.2rem]">
            Tu pedido vibra en colores antes de llegar
          </h1>
          <p className="max-w-sm text-base font-medium text-slate-600">
            Diseñamos la experiencia digital para que el menú, el pago y el retiro sucedan sin fricciones.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <Link
              href="#categorias"
              className="inline-flex items-center justify-center rounded-full bg-[var(--fc-brand-600)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fc-brand-500)]"
            >
              Ver categorías
            </Link>
            <Link
              href="#negocios"
              className="inline-flex items-center justify-center rounded-full border border-[var(--fc-border-soft)] bg-white/90 px-6 py-3 text-sm font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-200)]"
            >
              Conocer negocios
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {featureChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.55)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--fc-brand-600)]" />
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -top-14 -left-10 h-44 w-44 rounded-full bg-white/38 blur-3xl" aria-hidden />
          <div className="absolute -bottom-16 right-0 h-36 w-36 rounded-full bg-[var(--fc-brand-200)]/35 blur-[90px]" aria-hidden />

          <div className="relative overflow-hidden rounded-[44px] border border-white/60 bg-white/92 p-7 shadow-[0_46px_110px_-64px_rgba(15,23,42,0.7)] backdrop-blur">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 left-10 h-32 w-32 rounded-full bg-gradient-to-br from-[var(--fc-brand-200)]/40 to-transparent blur-[70px]" />
              <div className="absolute -bottom-10 right-10 h-36 w-36 rounded-[38%] bg-gradient-to-br from-[var(--fc-teal-300)]/35 to-transparent blur-[80px]" />
            </div>

            <div className="relative grid gap-4">
              {journeyCards.map((card) => (
                <div
                  key={card.label}
                  className="relative overflow-hidden rounded-[32px] border border-[var(--fc-border-soft)] bg-white/92 p-5 shadow-[0_32px_85px_-58px_rgba(15,23,42,0.68)]"
                >
                  <div className="absolute inset-0 opacity-80">
                    <div className={`absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br ${card.accent} blur-[80px]`} />
                  </div>
                  <div className="relative flex items-start gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/90 text-sm font-black text-[var(--fc-brand-600)]">
                      {card.label}
                    </span>
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-slate-900">{card.title}</p>
                      <p className="text-xs leading-relaxed text-slate-600">{card.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {floatingPanels.map((panel) => (
            <div
              key={panel.title}
              className={`hidden sm:block absolute ${panel.position} w-52 rounded-[28px] border border-white/60 bg-white/92 p-4 shadow-[0_28px_80px_-58px_rgba(15,23,42,0.75)] backdrop-blur`}
            >
              <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r ${panel.gradient} px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white`}>FilaCero</span>
              <p className="mt-2 text-sm font-semibold text-slate-900">{panel.title}</p>
              <p className="text-xs text-slate-500">{panel.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
