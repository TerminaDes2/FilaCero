"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, BusinessSummary } from "../../../lib/api";
import { resolveMediaUrl } from "../../../lib/media";
import { useTranslation } from "../../../hooks/useTranslation";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(value ?? 0);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(date);
};

const BusinessShowcase: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPublicBusinesses();
        if (!active) return;
        setBusinesses(data);
      } catch (err) {
        console.error("[BusinessShowcase]", err);
        if (!active) return;
        setError(t("shop.business.error"));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div className="-mx-2 mt-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 px-2 pb-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`business-skeleton-${idx}`} className="w-64 shrink-0">
              <div className="h-32 rounded-[30px] bg-slate-100 animate-pulse dark:bg-slate-800/60" />
              <div className="mt-3 space-y-2">
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-3 w-3/4 rounded-full bg-slate-100 dark:bg-slate-800/60" />
                <div className="h-8 rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (error) {
    content = (
      <div className="mt-4 rounded-3xl border border-yellow-200 bg-yellow-50 px-6 py-5 text-sm text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-200">
        {error}
      </div>
    );
  } else if (!businesses.length) {
    content = (
      <div className="mt-4 rounded-3xl border border-dashed border-[var(--fc-border-soft)] bg-white/70 px-6 py-10 text-center text-sm text-[var(--fc-text-secondary)] dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-[var(--fc-text-secondary)]">
        <div className="text-4xl">🏪</div>
        <p className="mt-3 font-semibold text-[var(--fc-text-primary)]">{t("shop.business.empty.title")}</p>
        <p className="mt-2">{t("shop.business.empty.subtitle")}</p>
      </div>
    );
  } else {
    content = (
      <div className="-mx-2 mt-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-4 px-2 pb-2">
          {businesses.map((business) => {
            const logoUrl = resolveMediaUrl(business.logo_url);
            const heroUrl = resolveMediaUrl(business.hero_image_url);
            const highlightProduct = business.productosDestacados[0];
            return (
              <article
                key={business.id_negocio}
                className="group relative w-64 shrink-0 overflow-hidden rounded-[32px] border border-[var(--fc-border-soft)] bg-white/85 shadow-[0_22px_45px_-36px_rgba(15,23,42,0.55)] backdrop-blur transition hover:-translate-y-1 hover:border-[var(--fc-brand-200)] dark:border-white/12 dark:bg-[color:rgba(10,15,30,0.9)] dark:shadow-[0_28px_70px_-44px_rgba(2,6,23,0.9)] dark:hover:border-[var(--fc-brand-400)]"
              >
                <div className="relative h-32">
                  {heroUrl ? (
                    <Image
                      src={heroUrl}
                      alt={`Portada de ${business.nombre}`}
                      fill
                      className="object-cover"
                      sizes="256px"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--fc-brand-500)] via-[var(--fc-brand-400)] to-[var(--fc-teal-400)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur dark:border-white/20 dark:bg-[color:rgba(15,23,42,0.68)]">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={business.nombre}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-sm font-semibold text-[var(--fc-brand-600)]">
                          {business.nombre.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white drop-shadow-md line-clamp-1">{business.nombre}</p>
                      {business.resumen.promedioEstrellas !== null && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-white/80">
                          ★ {business.resumen.promedioEstrellas.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-4 pb-5 pt-4">
                  {business.direccion && (
                    <p className="text-xs text-[var(--fc-text-secondary)] line-clamp-2">{business.direccion}</p>
                  )}

                    <div className="flex flex-wrap gap-2 text-[11px] text-[var(--fc-text-secondary)]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold dark:bg-[color:rgba(148,163,184,0.18)]">
                      {t("shop.business.stats.products", { count: String(formatNumber(business.resumen.totalProductos)) })}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold dark:bg-[color:rgba(148,163,184,0.18)]">
                      {t("shop.business.stats.orders", { count: String(formatNumber(business.resumen.totalPedidos)) })}
                    </span>
                  </div>

                  {business.categorias.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {business.categorias.slice(0, 3).map((categoria) => (
                        <span
                          key={categoria}
                          className="inline-flex items-center rounded-full bg-[var(--fc-brand-50)] px-2 py-1 text-[11px] font-medium text-[var(--fc-brand-700)] dark:bg-[color:rgba(233,74,111,0.14)] dark:text-[var(--fc-brand-200)]"
                        >
                          {categoria}
                        </span>
                      ))}
                      {business.categorias.length > 3 && (
                        <span className="text-[11px] text-[var(--fc-text-secondary)]">
                          +{business.categorias.length - 3} más
                        </span>
                      )}
                    </div>
                  )}

                  {highlightProduct && (
                    <div className="rounded-2xl border border-[var(--fc-border-soft)] bg-slate-50/80 px-3 py-2 text-[11px] text-[var(--fc-text-secondary)] dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.75)] dark:text-[var(--fc-text-secondary)]">
                      <p className="text-xs font-semibold text-[var(--fc-text-primary)]">Destacado</p>
                      <p className="line-clamp-2">{highlightProduct.nombre}</p>
                    </div>
                  )}

                    <div className="flex items-center justify-between text-[11px] text-[var(--fc-text-secondary)]">
                    <span>{t("shop.business.since", { date: formatDate(business.fecha_registro) })}</span>
                    <span>{formatCurrency(business.resumen.ingresosAcumulados)}</span>
                  </div>

                  <Link
                    href={`/stores/${business.id_negocio}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--fc-brand-600)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fc-brand-500)]"
                  >
                    {t("shop.business.visit")}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section id="negocios" className="mt-14">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-border-soft)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--fc-brand-600)] dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.82)]">
            {t("shop.business.badge")}
          </span>
          <h2 className="text-2xl font-bold text-[var(--fc-text-primary)]">{t("shop.business.title")}</h2>
          <p className="max-w-xl text-sm text-[var(--fc-text-secondary)]">
            {t("shop.business.subtitle")}
          </p>
        </div>
        <Link
          href="/stores"
          className="inline-flex items-center justify-center rounded-full border border-[var(--fc-border-soft)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-200)] dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-[var(--fc-text-primary)] dark:hover:border-[var(--fc-brand-300)]"
        >
          {t("shop.business.viewAll")}
        </Link>
      </header>
      {content}
    </section>
  );
};

export default BusinessShowcase;
