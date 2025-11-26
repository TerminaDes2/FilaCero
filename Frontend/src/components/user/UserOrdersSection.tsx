"use client";
import { Fragment, useMemo } from "react";
import { Calendar, Clock, Package, ShoppingBag, Sparkles, TrendingUp } from "lucide-react";

interface UserOrdersSectionProps {
  orders?: Array<{
    id: number;
    fecha: string;
    total: number;
    estado: string;
  }>;
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const statusConfig = {
  completado: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: "✓" },
  pendiente: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: "⏳" },
  cancelado: { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", icon: "✕" },
  default: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", icon: "•" },
} as const;

const getStatusConfig = (estado: string) => {
  const normalized = estado.toLowerCase();
  if (normalized.includes("complet") || normalized.includes("entreg")) {
    return statusConfig.completado;
  }
  if (normalized.includes("pend") || normalized.includes("proces")) {
    return statusConfig.pendiente;
  }
  if (normalized.includes("cancel")) {
    return statusConfig.cancelado;
  }
  return statusConfig.default;
};

export default function UserOrdersSection({ orders = [] }: UserOrdersSectionProps) {
  const mostRecent = orders[0];
  const timeline = useMemo(() => orders.slice(0, 8), [orders]);

  const totalSpent = useMemo(() => 
    orders.reduce((sum, order) => sum + order.total, 0),
    [orders]
  );

  const averageOrder = orders.length > 0 ? totalSpent / orders.length : 0;

  if (orders.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(222,53,95,0.05)_0%,transparent_60%)]" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="rounded-full bg-slate-100 p-6">
            <ShoppingBag className="h-12 w-12 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Aún no tienes pedidos</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Explora la tienda y realiza tu primera orden. Tu historial aparecerá automáticamente aquí.
            </p>
          </div>
          <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[var(--fc-brand-700)] hover:shadow-xl hover:scale-105">
            <ShoppingBag className="h-4 w-4" />
            Ir a la tienda
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-white p-6 shadow-lg transition-all hover:shadow-xl lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(222,53,95,0.06)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(38,198,183,0.06)_0%,transparent_60%)]" />
      
      <div className="relative space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-[var(--fc-brand-100)] p-2">
              <ShoppingBag className="h-5 w-5 text-[var(--fc-brand-600)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Historial de Pedidos</h2>
              <p className="text-sm text-slate-500">
                {orders.length} {orders.length === 1 ? 'pedido realizado' : 'pedidos realizados'}
              </p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-[var(--fc-brand-100)] bg-gradient-to-br from-[var(--fc-brand-50)] to-white p-4 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fc-brand-600)]">Total</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{currencyFormatter.format(totalSpent)}</p>
                <p className="mt-0.5 text-xs text-slate-500">Gastado en total</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[var(--fc-brand-300)]" />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[var(--fc-teal-100)] bg-gradient-to-br from-[var(--fc-teal-50)] to-white p-4 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fc-teal-600)]">Promedio</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{currencyFormatter.format(averageOrder)}</p>
                <p className="mt-0.5 text-xs text-slate-500">Por pedido</p>
              </div>
              <Sparkles className="h-8 w-8 text-[var(--fc-teal-300)]" />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Pedidos</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{orders.length}</p>
                <p className="mt-0.5 text-xs text-slate-500">Órdenes totales</p>
              </div>
              <Package className="h-8 w-8 text-slate-300" />
            </div>
          </div>
        </div>

        {/* Featured Order */}
        {mostRecent && (
          <div className="rounded-3xl border-2 border-[var(--fc-brand-200)] bg-gradient-to-br from-[var(--fc-brand-50)] via-white to-white p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--fc-brand-200)] to-[var(--fc-teal-200)] text-lg font-black text-white">
                    #{mostRecent.id}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fc-brand-600)]">
                      Pedido más reciente
                    </p>
                    <p className="text-2xl font-black text-slate-900">{currencyFormatter.format(mostRecent.total)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(mostRecent.fecha).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {new Date(mostRecent.fecha).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              <div>
                {(() => {
                  const config = getStatusConfig(mostRecent.estado);
                  return (
                    <span className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold capitalize ${config.bg} ${config.text} ${config.border}`}>
                      <span className="text-base">{config.icon}</span>
                      {mostRecent.estado}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Orders Timeline */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700">
            <Clock className="h-4 w-4" />
            Historial Reciente
          </h3>
          <div className="space-y-3">
            {timeline.map((order) => {
              const config = getStatusConfig(order.estado);
              return (
                <div
                  key={order.id}
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-[var(--fc-brand-200)] hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-mono text-sm font-bold text-slate-600">
                        #{order.id}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-slate-900">{currencyFormatter.format(order.total)}</p>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${config.bg} ${config.text} ${config.border}`}>
                            {config.icon} {order.estado}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(order.fecha).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })} • {new Date(order.fecha).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View All Button */}
        {orders.length > 8 && (
          <button className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:border-[var(--fc-brand-200)] hover:bg-[var(--fc-brand-50)] hover:text-[var(--fc-brand-600)]">
            Ver todos los pedidos ({orders.length})
          </button>
        )}
      </div>
    </section>
  );
}
