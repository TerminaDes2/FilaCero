"use client";
import { Fragment, useMemo } from "react";
import { Clock, PackageCheck, ShoppingBag, Sparkles } from "lucide-react";

interface UserOrdersSectionProps {
  orders?: Array<{
    id: number;
    fecha: string;
    total: number;
    estado: string;
  }>;
  className?: string;
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const statusChip = (estado: string) => {
  const normalized = estado.toLowerCase();
  if (normalized.includes("complet")) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200";
  }
  if (normalized.includes("pend")) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100";
  }
  return "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white/70";
};

export default function UserOrdersSection({ orders = [], className = "" }: UserOrdersSectionProps) {
  const mostRecent = orders[0];
  const timeline = useMemo(() => orders.slice(0, 6), [orders]);

  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border border-[var(--fc-border-soft)] bg-white/95 p-6 text-slate-900 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.25)] sm:p-8 dark:border-white/10 dark:bg-[color:rgba(7,11,22,0.94)] dark:text-[var(--fc-text-primary)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.08)_0%,transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1)_0%,transparent_60%)]" />
      <div className="relative space-y-6">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-300)]">
            <ShoppingBag className="h-4 w-4" />
            Historial de pedidos sincronizado
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Tus últimas órdenes y su estado operativo</h2>
          <p className="text-sm text-slate-500 dark:text-white/70">
            Visualiza cómo tus compras atraviesan cocina y POS. Reordena con un toque y mantén visibilidad sobre entregas.
          </p>
        </header>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-6 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            Aún no tienes pedidos registrados. Descubre productos en la tienda y tu historial se activará automáticamente.
          </div>
        ) : (
          <Fragment>
            <div className="grid gap-4 rounded-2xl border border-slate-100 bg-gradient-to-br from-[var(--fc-brand-50)] via-white to-white px-5 py-5 dark:border-white/10 dark:from-[color:rgba(62,26,106,0.25)] dark:via-[color:rgba(25,32,52,0.65)] dark:to-[color:rgba(13,18,32,0.9)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-300)]">Pedido más reciente</p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">#{mostRecent.id}</h3>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusChip(mostRecent.estado)}`}>
                  <PackageCheck className="h-4 w-4" />
                  {mostRecent.estado}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-white/75">
                <span className="inline-flex items-center gap-2 dark:text-white/70">
                  <Clock className="h-4 w-4" />
                  {new Date(mostRecent.fecha).toLocaleString("es-MX", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="inline-flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                  {currencyFormatter.format(mostRecent.total)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/60">
                Identificamos este ticket en cocina y lo sincronizamos en tiempo real con tus tableros. Puedes reactivarlo desde el POS o desde este dashboard.
              </p>
            </div>

            <div className="relative mt-4">
              <div className="absolute left-4 top-3 bottom-3 hidden w-px bg-gradient-to-b from-[var(--fc-brand-200)] via-slate-200 to-transparent sm:block dark:from-[color:rgba(125,211,252,0.3)] dark:via-[color:rgba(255,255,255,0.08)]" />
              <ol className="space-y-4">
                {timeline.map((order, index) => (
                  <li
                    key={order.id}
                    className="relative flex gap-4 rounded-2xl border border-slate-100 bg-white/90 px-4 py-4 shadow-sm transition hover:border-[var(--fc-brand-200)] dark:border-white/10 dark:bg-[color:rgba(10,14,28,0.82)] dark:hover:border-[color:rgba(56,189,248,0.4)]"
                  >
                    <div className="flex flex-col items-center">
                      <span className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[var(--fc-brand-200)] bg-white text-xs font-semibold text-[var(--fc-brand-600)] dark:border-[color:rgba(56,189,248,0.4)] dark:bg-transparent dark:text-[var(--fc-brand-200)] sm:grid">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 text-sm text-slate-600 dark:text-white/70">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-slate-900 dark:text-white">
                          <span className="font-semibold">#{order.id}</span>
                          <span className="text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-white/40">
                            {new Date(order.fecha).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusChip(order.estado)}`}>
                          {order.estado}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-white/60">
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5" />
                          {currencyFormatter.format(order.total)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(order.fecha).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Fragment>
        )}
      </div>
    </section>
  );
}
