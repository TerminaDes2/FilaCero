"use client";
import { Reveal } from "../../components/Reveal";
import { SectionHeading } from "../../components/SectionHeading";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Gratis",
    price: "$0",
    period: "",
    highlight: false,
    features: ["Hasta 50 productos", "Ventas ilimitadas", "Reportes básicos"],
    details: "Ideal para comenzar con una cafetería pequeña y probar la plataforma sin costo.",
    cta: "Empezar",
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mes",
    highlight: true,
    features: [
      "Inventario avanzado",
      "Reportes detallados",
      "Exportación de datos",
      "Soporte prioritario",
    ],
    details: "Diseñado para cafeterías en crecimiento que necesitan más control y soporte especializado.",
    cta: "Pasar a Pro",
  },
  {
    name: "Institucional",
    price: "Custom",
    period: "",
    highlight: false,
    features: [
      "Multi-sede",
      "Integraciones a medida",
      "Onboarding asistido",
      "SLAs personalizados",
    ],
    details: "Perfecto para instituciones grandes con múltiples sedes y necesidades personalizadas.",
    cta: "Contactar",
  },
];

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
  if (!open || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-8 relative animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white text-xl"
          aria-label="Cerrar"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-2 text-brand-600 dark:text-brand-400">
          {plan.name}
        </h2>
        <div className="text-3xl font-semibold mb-4 text-gray-900 dark:text-white">
          {plan.price}{" "}
          <span className="text-base font-medium text-gray-500 dark:text-slate-400">
            {plan.period}
          </span>
        </div>
        <p className="mb-6 text-gray-600 dark:text-slate-300">{plan.details}</p>

        {/* Lista con animación hover */}
        <ul className="mb-6 space-y-2 text-gray-700 dark:text-slate-200 group">
          {plan.features.map((f) => (
            <li
              key={f}
              className="flex gap-2 items-start transform transition duration-300 group-hover:translate-x-1 group-hover:text-brand-600 dark:group-hover:text-brand-400"
            >
              <span className="text-brand-600 dark:text-brand-400 mt-0.5">✔</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          href={
            plan.name === "Gratis"
              ? "/auth/register?plan=free"
              : plan.name === "Pro"
              ? "/auth/register?plan=pro"
              : "/auth/register?contact=institucional"
          }
          className={`w-full block text-center font-semibold py-3 rounded-xl transition relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
            plan.highlight
              ? "bg-brand-600 text-white hover:bg-brand-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          }`}
          onClick={onClose}
        >
          {plan.cta}
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

  const handleShowDetail = (plan: Plan) => setSelectedPlan(plan);
  const handleClose = () => setSelectedPlan(null);

  return (
    <section
      id="pricing"
      className="py-32 relative overflow-hidden bg-gradient-to-b from-white via-brand-50/40 to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(233,74,111,0.25), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          badge="Planes"
          badgeTone="brand"
          title="Precios simples"
          subtitle="Elige el plan que más se adapta al tamaño de tu operación."
        />
        <div className="grid gap-10 md:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal
              key={p.name}
              delay={90 * i}
              className={`relative group flex flex-col rounded-3xl border backdrop-blur-xl overflow-hidden ${
                p.highlight
                  ? "bg-white/85 dark:bg-slate-900/70 border-brand-400/40 shadow-glow"
                  : "bg-white/70 dark:bg-slate-900/50 border-gray-200/60 dark:border-white/10"
              } transition`}
            >
              {p.highlight && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
              )}
              <div className="p-7 flex flex-col flex-1">
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-slate-100">
                  {p.name}
                </h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-5">
                  {p.price}{" "}
                  <span className="text-base font-medium text-gray-500 dark:text-slate-400">
                    {p.period}
                  </span>
                </div>
                <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 items-start">
                      <span className="text-brand-600 dark:text-brand-400 mt-0.5">
                        ✔
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleShowDetail(p)}
                  className={`w-full text-center font-semibold py-3 rounded-xl transition relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                    p.highlight
                      ? "bg-brand-600 text-white hover:bg-brand-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                  }`}
                >
                  Ver detalles
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      {/* Modal */}
      <PlanDetailModal open={!!selectedPlan} plan={selectedPlan} onClose={handleClose} />
    </section>
  );
}
