"use client";
import React, { useEffect, useMemo } from "react";
import { CreditCard, Wallet } from "lucide-react";

type PaymentOption = "efectivo" | "tarjeta";

interface Props {
  paymentMethod: PaymentOption | "";
  setPaymentMethod: (value: PaymentOption | "") => void;
  displayMode?: "standalone" | "embedded";
  allowedMethods?: Array<PaymentOption>;
}

const METHODS = [
  {
    id: "efectivo" as const,
    title: "Pago en efectivo",
    description: "Cancela en barra y simplifica el cierre de caja",
    icon: Wallet,
    perks: ["Se marca como pagado en el POS", "Ideal para recreos rápidos"],
  },
  {
    id: "tarjeta" as const,
    title: "Tarjeta / QR",
    description: "Registra la venta como cobro digital",
    icon: CreditCard,
    perks: ["Compatible con terminal física", "Permite conciliación posterior"],
  },
];

const DEFAULT_ALLOWED_METHODS: Array<PaymentOption> = ["efectivo", "tarjeta"];

export default function PaymentMethod({
  paymentMethod,
  setPaymentMethod,
  displayMode = "standalone",
  allowedMethods = DEFAULT_ALLOWED_METHODS,
}: Props) {
  const isStandalone = displayMode !== "embedded";
  const wrapperClasses = isStandalone
    ? "rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur"
    : "space-y-6";
  const headerClasses = `flex items-start gap-3 ${isStandalone ? "border-b border-white/60 px-6 py-5" : ""}`;
  const iconClasses = isStandalone
    ? "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--fc-brand-600)] to-[var(--fc-teal-400)] text-white shadow-sm"
    : "inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--fc-brand-600)]/10 text-[var(--fc-brand-600)]";
  const copyClasses = isStandalone ? "space-y-1" : "space-y-0.5";
  const contentPadding = isStandalone ? "px-6 py-6" : "";

  const filteredMethods = useMemo(() => METHODS.filter((method) => allowedMethods.includes(method.id)), [allowedMethods]);

  useEffect(() => {
    if (!filteredMethods.length) {
      setPaymentMethod("");
      return;
    }
    const currentIsAllowed = filteredMethods.some((method) => method.id === paymentMethod);
    if (!currentIsAllowed) {
      setPaymentMethod(filteredMethods[0].id);
    }
  }, [filteredMethods, paymentMethod, setPaymentMethod]);

  return (
    <section className={wrapperClasses}>
      <div className={headerClasses}>
        <span className={iconClasses}>
          <CreditCard className="h-5 w-5" />
        </span>
        <div className={copyClasses}>
          <p className={`${isStandalone ? "text-xs" : "text-[11px]"} font-semibold uppercase tracking-[0.22em] text-brand-600`}>Paso 2</p>
          <h2 className={`${isStandalone ? "text-xl" : "text-lg"} font-bold text-slate-900`}>Selecciona cómo cobrarás</h2>
          <p className={`${isStandalone ? "text-sm" : "text-xs"} text-slate-500`}>
            La venta se registrará en el POS con el método que elijas para mantener los reportes alineados.
          </p>
        </div>
      </div>

      <div className={`${contentPadding} grid gap-4 sm:grid-cols-2`}>
        {filteredMethods.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500">
            No hay métodos de pago disponibles en este flujo.
          </div>
        ) : (
          filteredMethods.map((method) => {
            const Icon = method.icon;
            const isActive = paymentMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                className={`group h-full rounded-2xl border px-5 py-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200/80 bg-white hover:border-[var(--fc-brand-200)] hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      isActive ? "bg-white/15" : "bg-[var(--fc-brand-50)] text-[var(--fc-brand-600)]"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-[var(--fc-brand-600)]"}`} />
                  </span>
                  <div className="space-y-0.5">
                    <div className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-900"}`}>{method.title}</div>
                    <p className={`text-xs ${isActive ? "text-white/80" : "text-slate-500"}`}>{method.description}</p>
                  </div>
                </div>
                <ul className={`mt-4 space-y-1 text-[11px] ${isActive ? "text-white/80" : "text-slate-500"}`}>
                  {method.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-1.5">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : "bg-[var(--fc-brand-400)]"}`} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
