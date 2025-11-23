"use client";
import { Reveal } from "../../components/Reveal";
import { SectionHeading } from "../../components/SectionHeading";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "FilaCero Libre",
    price: "$0",
    period: "",
    highlight: true,
    features: [
      "Productos, ventas e inventario ilimitados",
      "Pedidos QR y POS sin comisiones",
      "Reportes operativos en tiempo real",
      "Cortes de caja asistidos",
      "Usuarios ilimitados por cafetería",
    ],
    details:
      "Todo el núcleo del software está disponible sin costo para cafeterías y comedores escolares. Solo necesitas crear tu cuenta y activar tu catálogo.",
    cta: "Crear cuenta gratuita",
  },
];

const extensions = [
  {
    name: "Pagos con tarjeta y wallet",
    status: "Próximamente",
    description: "Cobros integrados con concilia\u00adci\u00f3n automática y asignación por turno.",
  },
  {
    name: "Integración con sistemas escolares",
    status: "En exploración",
    description: "Sincronización con credenciales estudiantiles y facturación institucional.",
  },
  {
    name: "Anal\u00edtica avanzada",
    status: "Beta privada",
    description: "Proyecciones de demanda, análisis de horarios pico y alertas inteligentes.",
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
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
          aria-label="Cerrar"
        >
          ×
        </button>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{plan.name}</h2>
        <div className="text-3xl font-semibold mb-4 text-gray-900">
          {plan.price}{" "}
          {plan.period && (
            <span className="text-base font-medium text-gray-500">{plan.period}</span>
          )}
        </div>
        <p className="mb-6 text-gray-600">{plan.details}</p>

        {/* Lista con animación hover */}
        <ul className="mb-6 space-y-2 text-gray-700 group">
          {plan.features.map((f) => (
            <li
              key={f}
              className="flex gap-2 items-start transform transition duration-300 group-hover:translate-x-1 group-hover:text-brand-600"
            >
              <span className="text-brand-600 mt-0.5">✔</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/register"
          className={`w-full block text-center font-semibold py-3 rounded-xl transition relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
            plan.highlight
              ? "bg-brand-600 text-white hover:bg-brand-500"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
      className="py-32 relative overflow-hidden bg-gradient-to-b from-white via-brand-50/40 to-white"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(233,74,111,0.25), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          badge="Acceso"
          badgeTone="brand"
          title="Todo incluido sin costo"
          subtitle="Activa FilaCero Libre y agrega servicios opcionales a medida que creces."
        />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="grid gap-8">
            {plans.map((p, i) => (
              <Reveal
                key={p.name}
                delay={90 * i}
                className={`relative group flex flex-col rounded-3xl border backdrop-blur-xl overflow-hidden ${
                  p.highlight
                    ? "bg-white/85 border-brand-400/40 shadow-glow"
                    : "bg-white/70 border-gray-200/60"
                } transition`}
              >
                {p.highlight && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
                )}
                <div className="p-7 flex flex-col flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    {p.name}
                  </h3>
                  <div className="text-4xl font-bold text-gray-900 mb-5">
                    {p.price}
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2 items-start">
                        <span className="text-brand-600 mt-0.5">✔</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => handleShowDetail(p)}
                      className="w-full text-center font-semibold py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    >
                      Ver todo lo incluido
                    </button>
                    <Link
                      href="/register"
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-brand-600/40 bg-white text-sm font-semibold text-brand-700 hover:border-brand-600 hover:text-brand-800 transition"
                    >
                      Activar FilaCero Libre
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <aside className="relative rounded-3xl border border-white/50 bg-white/75 p-8 shadow-sm backdrop-blur">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-brand-400/10 via-teal-400/10 to-transparent" aria-hidden />
            <h3 className="text-lg font-semibold text-gray-900">Servicios opcionales</h3>
            <p className="mt-2 text-sm text-gray-600">
              Estamos trabajando en complementos para equipos que necesitan integrar pagos, analytics avanzadas o procesos institucionales.
            </p>
            <ul className="mt-6 space-y-4">
              {extensions.map((extension) => (
                <li key={extension.name} className="rounded-2xl border border-gray-200/70 bg-white/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">{extension.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{extension.description}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
                      {extension.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-gray-500">
              ¿Necesitas algo específico? Escríbenos a <a href="mailto:team@filacero.com" className="font-medium text-brand-600 hover:underline">team@filacero.com</a>.
            </p>
          </aside>
        </div>
      </div>
      {/* Modal */}
      <PlanDetailModal open={!!selectedPlan} plan={selectedPlan} onClose={handleClose} />
    </section>
  );
}
