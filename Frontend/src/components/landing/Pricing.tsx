"use client";
import { Reveal } from "../../components/Reveal";
import { SectionHeading } from "../../components/SectionHeading";
import { useTranslation } from "../../hooks/useTranslation";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    nameKey: "landing.pricing.planFree.name",
    priceKey: "landing.pricing.planFree.price",
    periodKey: "landing.pricing.planFree.period",
    highlight: true,
    featuresKeys: [
      "landing.pricing.planFree.features.1",
      "landing.pricing.planFree.features.2",
      "landing.pricing.planFree.features.3",
      "landing.pricing.planFree.features.4",
      "landing.pricing.planFree.features.5"
    ],
    detailsKey: "landing.pricing.planFree.details",
    ctaKey: "landing.pricing.planFree.cta",
  },
];

// extension keys are read from translations so the cards are localized
const extensionKeys = ["payments", "school", "analytics"];

type Plan = typeof plans[number];

function PlanDetailModal({
  open,
  plan,
  onClose,
}: {
  open: boolean;
  plan: Plan | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!open || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn dark:bg-slate-950/70">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl animate-slideUp dark:bg-slate-900/90 dark:shadow-brand-950/40">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl dark:text-slate-400 dark:hover:text-slate-200"
          aria-label="Cerrar"
        >
          ×
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t(plan.nameKey)}</h2>
        <div className="text-3xl font-semibold mb-4 text-gray-900">
          {t(plan.priceKey)}{" "}
          {t(plan.periodKey) && (
            <span className="text-base font-medium text-gray-500">{t(plan.periodKey)}</span>
          )}
        </div>
        <p className="mb-6 text-gray-600">{t(plan.detailsKey)}</p>

        {/* Lista con animación hover */}
        <ul className="mb-6 space-y-2 text-gray-700 group">
          {plan.featuresKeys.map((fk) => (
            <li
              key={fk}
              className="flex gap-2 items-start transform transition duration-300 group-hover:translate-x-1 group-hover:text-brand-600"
            >
              <span className="text-brand-600 mt-0.5">✔</span>
              <span>{t(fk)}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/auth/register"
          className={`w-full block text-center font-semibold py-3 rounded-xl transition relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
            plan.highlight
              ? "bg-brand-600 text-white hover:bg-brand-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          }`}
          onClick={onClose}
        >
          {t(plan.ctaKey)}
        </Link>
      </div>

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { t } = useTranslation();

  const handleShowDetail = (plan: Plan) => setSelectedPlan(plan);
  const handleClose = () => setSelectedPlan(null);

  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-32 bg-gradient-to-b from-white via-brand-50/40 to-white dark:from-slate-950 dark:via-slate-900/70 dark:to-slate-950"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(233,74,111,0.25), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/80 via-white/30 to-transparent dark:from-slate-950/70 dark:via-slate-950/25 dark:to-transparent"
        style={{
          mixBlendMode: "normal",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          badge={t("landing.pricing.badge")}
          badgeTone="brand"
          title={t("landing.pricing.title")}
          subtitle={t("landing.pricing.subtitle")}
        />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="grid gap-8">
            {plans.map((p, i) => (
              <Reveal
                key={p.nameKey}
                delay={90 * i}
                className={`relative group flex flex-col rounded-3xl border backdrop-blur-xl overflow-hidden ${
                  p.highlight
                    ? "bg-white/85 border-brand-400/40 shadow-glow dark:bg-slate-900/70 dark:border-brand-500/35 dark:shadow-[0_40px_120px_-60px_rgba(233,74,111,0.65)]"
                    : "bg-white/70 border-gray-200/60 dark:bg-slate-900/55 dark:border-white/10"
                } transition`}
              >
                {p.highlight && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
                )}
                <div className="p-7 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    {t(p.nameKey)}
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 mb-5">
                    {t(p.priceKey)}
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-1">
                    {p.featuresKeys.map((fk) => (
                      <li key={fk} className="flex gap-2 items-start">
                        <span className="text-brand-600 mt-0.5">✔</span>
                        <span>{t(fk)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => handleShowDetail(p)}
                      className="w-full text-center font-semibold py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    >
                      {t("landing.pricing.viewIncluded")}
                    </button>
                    <Link
                      href="/register"
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-brand-600/40 bg-white text-sm font-semibold text-brand-700 hover:border-brand-600 hover:text-brand-800 transition dark:border-brand-300/40 dark:bg-slate-900 dark:text-brand-100 dark:hover:border-brand-200 dark:hover:text-brand-50"
                    >
                      {t("landing.pricing.activateFree")}
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <aside className="relative rounded-3xl border border-white/50 bg-white/75 p-8 shadow-sm backdrop-blur">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-brand-400/10 via-teal-400/10 to-transparent" aria-hidden />
            <h3 className="text-lg font-semibold text-gray-900">{t("landing.pricing.optionalServices.title")}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {t("landing.pricing.optionalServices.subtitle")}
            </p>
            <ul className="mt-6 space-y-4">
              {extensionKeys.map((key) => (
                <li key={key} className="rounded-2xl border border-gray-200/70 bg-white/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">{t(`landing.pricing.optionalServices.extensions.${key}.name`)}</p>
                      <p className="text-sm text-gray-500 mt-1">{t(`landing.pricing.optionalServices.extensions.${key}.description`)}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
                      {t(`landing.pricing.optionalServices.extensions.${key}.status`)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-gray-500">
              {t("landing.pricing.optionalServices.contact")} <a href="mailto:team@filacero.com" className="font-medium text-brand-600 hover:underline">team@filacero.com</a>.
            </p>
          </aside>
        </div>
      </div>
      {/* Modal */}
      <PlanDetailModal open={!!selectedPlan} plan={selectedPlan} onClose={handleClose} />
    </section>
  );
}
