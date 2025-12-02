"use client";
import Link from "next/link";
import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

const featureChipKeys = [
  "shop.hero.chips.menuLive",
  "shop.hero.chips.cashless",
  "shop.hero.chips.timedPickup",
  "shop.hero.chips.instantAlerts",
];

const floatingPanels = [
  {
    titleKey: "shop.hero.floating.explore.title",
    detailKey: "shop.hero.floating.explore.detail",
    gradient: "from-[var(--fc-brand-500)] to-[var(--fc-teal-500)]",
    position: "-top-6 right-5",
  },
  {
    titleKey: "shop.hero.floating.confirm.title",
    detailKey: "shop.hero.floating.confirm.detail",
    gradient: "from-fuchsia-500 to-violet-500",
    position: "top-32 -left-10",
  },
  {
    titleKey: "shop.hero.floating.pickup.title",
    detailKey: "shop.hero.floating.pickup.detail",
    gradient: "from-amber-500 to-orange-500",
    position: "bottom-4 right-6",
  },
];

const journeyCards = [
  {
    label: "01",
    titleKey: "shop.hero.journey.discover.title",
    bodyKey: "shop.hero.journey.discover.body",
    accent: "from-rose-500/80 to-orange-400/80",
  },
  {
    label: "02",
    titleKey: "shop.hero.journey.build.title",
    bodyKey: "shop.hero.journey.build.body",
    accent: "from-cyan-500/80 to-sky-400/80",
  },
  {
    label: "03",
    titleKey: "shop.hero.journey.pickup.title",
    bodyKey: "shop.hero.journey.pickup.body",
    accent: "from-emerald-500/80 to-teal-400/80",
  },
];

export default function ShopHero() {
  const { t } = useTranslation();
  return (
    <section className="relative mt-2 overflow-hidden rounded-[56px] border border-[var(--fc-border-soft)] bg-[radial-gradient(1400px_480px_at_-18%_-60%,rgba(222,53,95,0.23),transparent_70%),radial-gradient(1200px_460px_at_120%_-40%,rgba(33,197,176,0.25),transparent_70%),linear-gradient(120deg,rgba(255,255,255,0.82),rgba(255,255,255,0.92))] shadow-[0_42px_120px_-62px_rgba(15,23,42,0.58)] dark:border-white/12 dark:bg-[radial-gradient(1400px_480px_at_-18%_-60%,rgba(233,74,111,0.34),transparent_72%),radial-gradient(1200px_460px_at_120%_-40%,rgba(20,184,166,0.32),transparent_72%),linear-gradient(120deg,rgba(2,6,23,0.94),rgba(4,10,28,0.86))] dark:shadow-[0_48px_140px_-72px_rgba(2,6,23,0.92)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-6 top-6 h-56 w-56 rounded-[42%] bg-white/55 blur-3xl dark:bg-[color:rgba(15,23,42,0.45)]" aria-hidden />
        <div className="absolute right-10 top-10 h-48 w-72 rotate-12 rounded-[50%] bg-[var(--fc-brand-200)]/40 blur-[100px] dark:bg-[color:rgba(233,74,111,0.32)]" aria-hidden />
        <div className="absolute left-1/3 top-16 h-16 w-16 rotate-6 rounded-full border border-white/70 bg-white/70 dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.78)]" aria-hidden />
        <div className="absolute right-14 bottom-20 h-14 w-14 -rotate-6 rounded-full border border-white/70 bg-white/70 dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.78)]" aria-hidden />
        <div className="absolute left-10 bottom-10 h-12 w-32 rounded-full bg-[var(--fc-teal-200)]/40 blur-2xl dark:bg-[color:rgba(20,184,166,0.32)]" aria-hidden />
        <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-[46%] bg-[var(--fc-teal-200)]/30 blur-[120px] dark:bg-[color:rgba(20,184,166,0.26)]" aria-hidden />
        <div className="absolute top-20 left-1/2 h-32 w-32 -translate-x-1/2 rounded-[40%] bg-gradient-to-br from-white/60 to-transparent dark:from-[color:rgba(148,163,184,0.22)] dark:to-transparent" aria-hidden />
      </div>

      <div className="relative grid gap-14 px-6 py-14 sm:px-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--fc-brand-600)] dark:border-white/15 dark:bg-[color:rgba(15,23,42,0.82)]">
            {t("shop.hero.badge")}
          </span>
          <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight text-[var(--fc-text-primary)] sm:text-[3.2rem]">
            {t("shop.hero.title")}
          </h1>
          <p className="max-w-sm text-base font-medium text-[var(--fc-text-secondary)]">
            {t("shop.hero.subtitle")}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <Link
              href="#categorias"
              className="inline-flex items-center justify-center rounded-full bg-[var(--fc-brand-600)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fc-brand-500)]"
            >
              {t("shop.hero.cta.categories")}
            </Link>
            <Link
              href="#negocios"
              className="inline-flex items-center justify-center rounded-full border border-[var(--fc-border-soft)] bg-white/90 px-6 py-3 text-sm font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-200)] dark:border-white/15 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-[var(--fc-text-primary)] dark:hover:border-[var(--fc-brand-400)]"
            >
              {t("shop.hero.cta.businesses")}
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {featureChipKeys.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-1.5 text-xs font-semibold text-[var(--fc-text-primary)] shadow-[0_18px_35px_-28px_rgba(15,23,42,0.55)] dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.78)] dark:text-[var(--fc-text-primary)] dark:shadow-[0_20px_48px_-30px_rgba(2,6,23,0.88)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--fc-brand-600)]" />
                {t(key)}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -top-14 -left-10 h-44 w-44 rounded-full bg-white/38 blur-3xl dark:bg-[color:rgba(15,23,42,0.5)]" aria-hidden />
          <div className="absolute -bottom-16 right-0 h-36 w-36 rounded-full bg-[var(--fc-brand-200)]/35 blur-[90px] dark:bg-[color:rgba(233,74,111,0.28)]" aria-hidden />

          <div className="relative overflow-hidden rounded-[44px] border border-white/60 bg-white/92 p-7 shadow-[0_46px_110px_-64px_rgba(15,23,42,0.7)] backdrop-blur dark:border-white/15 dark:bg-[color:rgba(7,12,30,0.9)] dark:shadow-[0_48px_120px_-70px_rgba(2,6,23,0.9)]">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 left-10 h-32 w-32 rounded-full bg-gradient-to-br from-[var(--fc-brand-200)]/40 to-transparent blur-[70px] dark:from-[color:rgba(233,74,111,0.28)]" />
              <div className="absolute -bottom-10 right-10 h-36 w-36 rounded-[38%] bg-gradient-to-br from-[var(--fc-teal-300)]/35 to-transparent blur-[80px] dark:from-[color:rgba(20,184,166,0.3)]" />
            </div>

            <div className="relative grid gap-4">
              {journeyCards.map((card) => (
                <div
                  key={card.label}
                  className="relative overflow-hidden rounded-[32px] border border-[var(--fc-border-soft)] bg-white/92 p-5 shadow-[0_32px_85px_-58px_rgba(15,23,42,0.68)] dark:border-white/12 dark:bg-[color:rgba(10,15,30,0.9)] dark:shadow-[0_34px_90px_-60px_rgba(2,6,23,0.88)]"
                >
                  <div className="absolute inset-0 opacity-80">
                    <div className={`absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br ${card.accent} blur-[80px]`} />
                  </div>
                  <div className="relative flex items-start gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/90 text-sm font-black text-[var(--fc-brand-600)] dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-[var(--fc-brand-200)]">
                      {card.label}
                    </span>
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-[var(--fc-text-primary)]">{t(card.titleKey)}</p>
                      <p className="text-xs leading-relaxed text-[var(--fc-text-secondary)]">{t(card.bodyKey)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {floatingPanels.map((panel) => (
            <div
              key={panel.titleKey}
              className={`hidden sm:block absolute ${panel.position} w-52 rounded-[28px] border border-white/60 bg-white/92 p-4 shadow-[0_28px_80px_-58px_rgba(15,23,42,0.75)] backdrop-blur dark:border-white/12 dark:bg-[color:rgba(10,15,30,0.9)] dark:shadow-[0_32px_90px_-62px_rgba(2,6,23,0.92)]`}
            >
              <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-r ${panel.gradient} px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white`}>FilaCero</span>
              <p className="mt-2 text-sm font-semibold text-[var(--fc-text-primary)]">{t(panel.titleKey)}</p>
              <p className="text-xs text-[var(--fc-text-secondary)]">{t(panel.detailKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
