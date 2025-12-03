"use client";
import React, { useMemo, useState } from "react";
import { Clock3, Sparkles } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

interface Props {
  deliveryTime: string;
  setDeliveryTime: (value: string) => void;
  displayMode?: "standalone" | "embedded";
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function computeSlots() {
  const options: Array<{ label: string; value: string; description: string }> = [];
  const now = new Date();
  const asapValue = "asap";
  options.push({
    label: "Lo antes posible",
    value: asapValue,
    description: "Tu pedido se prepara en cuanto llegue a cocina",
  });

  const baseline = new Date(now.getTime() + 10 * 60 * 1000);
  const minutes = baseline.getMinutes();
  baseline.setMinutes(minutes - (minutes % 5));
  baseline.setSeconds(0, 0);

  for (let i = 0; i < 4; i += 1) {
    const slot = new Date(baseline.getTime() + i * 15 * 60 * 1000);
    const diffMinutes = Math.max(5, Math.round((slot.getTime() - now.getTime()) / 60000));
    options.push({
      label: formatTime(slot),
      value: formatTime(slot),
      description: `En aproximadamente ${diffMinutes} min`,
    });
  }
  return options;
}

export default function DeliveryTime({ deliveryTime, setDeliveryTime, displayMode = "standalone" }: Props) {
  const { t } = useTranslation();
  const [manualTime, setManualTime] = useState(() => (deliveryTime && deliveryTime !== "asap" ? deliveryTime : ""));
  const slots = useMemo(() => computeSlots(), []);

  const isStandalone = displayMode !== "embedded";
  const wrapperClasses = isStandalone
    ? "rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-colors dark:border-white/12 dark:bg-[color:rgba(6,10,22,0.92)] dark:shadow-[0_48px_120px_-80px_rgba(2,6,23,0.88)]"
    : "space-y-6";
  const headerClasses = `flex items-start gap-3 ${isStandalone ? "border-b border-white/60 px-6 py-5 dark:border-white/10" : ""}`;
  const iconClasses = isStandalone
    ? "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--fc-brand-500)] to-[var(--fc-teal-400)] text-white shadow-sm dark:from-[var(--fc-brand-500)] dark:to-[var(--fc-teal-400)]"
    : "inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--fc-brand-500)]/10 text-[var(--fc-brand-600)] dark:bg-[color:rgba(14,34,53,0.65)] dark:text-[color:rgba(190,227,248,0.95)]";
  const copyClasses = isStandalone ? "space-y-1" : "space-y-0.5";
  const contentPadding = isStandalone ? "px-6 py-6" : "";

  const handleSelect = (value: string) => {
    setDeliveryTime(value);
    if (value === "asap") {
      setManualTime("");
    } else {
      setManualTime(value);
    }
  };

  return (
    <section className={wrapperClasses}>
      <div className={headerClasses}>
        <span className={iconClasses}>
          <Clock3 className="h-5 w-5" />
        </span>
        <div className={copyClasses}>
          <p className={`${isStandalone ? "text-xs" : "text-[11px]"} font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-[color:rgba(190,227,248,0.95)]`}>{t("checkout.delivery.stepBadge")}</p>
          <h2 className={`${isStandalone ? "text-xl" : "text-lg"} font-bold text-slate-900 dark:text-white`}>{t("checkout.delivery.title")}</h2>
          <p className={`${isStandalone ? "text-sm" : "text-xs"} text-slate-500 dark:text-slate-400`}>
            {t("checkout.delivery.subtitle")}
          </p>
        </div>
      </div>

      <div className={`${contentPadding} space-y-6`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => {
            const isActive = deliveryTime === slot.value;
            return (
              <button
                key={slot.value}
                type="button"
                onClick={() => handleSelect(slot.value)}
                className={`rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isActive
                    ? "border-[var(--fc-brand-600)] bg-[var(--fc-brand-50)] text-[var(--fc-brand-700)] shadow-sm dark:border-[var(--fc-brand-400)] dark:bg-[color:rgba(12,74,110,0.45)] dark:text-[color:rgba(190,227,248,0.95)]"
                    : "border-slate-200/80 bg-white hover:border-[var(--fc-brand-200)] dark:border-white/10 dark:bg-[color:rgba(6,10,22,0.9)] dark:hover:border-[color:rgba(56,189,248,0.35)]"
                }`}
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{slot.label}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{slot.description}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 transition-colors dark:border-white/10 dark:bg-[color:rgba(6,10,22,0.9)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{t("checkout.delivery.manualTitle")}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t("checkout.delivery.manualSubtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={manualTime}
                onChange={(event) => {
                  const value = event.target.value;
                  setManualTime(value);
                  if (value) {
                    setDeliveryTime(value);
                  }
                }}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 transition focus:border-[var(--fc-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-200)] dark:border-white/15 dark:bg-[color:rgba(6,10,22,0.95)] dark:text-white dark:focus:border-[color:rgba(56,189,248,0.45)] dark:focus:ring-[color:rgba(56,189,248,0.25)]"
              />
              <button
                type="button"
                onClick={() => handleSelect("asap")}
                className="text-xs font-medium text-[var(--fc-brand-600)] transition hover:underline dark:text-[color:rgba(190,227,248,0.95)]"
              >
                {t("checkout.delivery.reset")}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="h-4 w-4 text-[var(--fc-brand-500)] dark:text-[color:rgba(190,227,248,0.95)]" />
          {t("checkout.delivery.note")}
        </div>
      </div>
    </section>
  );
}
