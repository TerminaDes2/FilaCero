import { Reveal } from "../../components/Reveal";

const plans = [
  {
    name: "Gratis",
    price: "$0",
    period: "",
    highlight: false,
    features: ["Hasta 50 productos", "Ventas ilimitadas", "Reportes básicos"],
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
    cta: "Probar Pro",
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
    cta: "Contactar",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-32 relative overflow-hidden bg-gradient-to-b from-white via-brand-50/40 to-white dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30" style={{ background: "radial-gradient(circle at 70% 30%, rgba(233,74,111,0.25), transparent 70%)" }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl mb-16 text-center mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Precios simples</h2>
          <p className="text-gray-600 dark:text-slate-300">Elige el plan que más se adapta al tamaño de tu operación.</p>
        </Reveal>
        <div className="grid gap-10 md:grid-cols-3">
          {plans.map((p,i) => (
            <Reveal key={p.name} delay={90*i} className={`relative group flex flex-col rounded-3xl border backdrop-blur-xl overflow-hidden ${
              p.highlight ? 'bg-white/80 dark:bg-slate-900/70 border-brand-400/50 shadow-glow scale-[1.025]' : 'bg-white/70 dark:bg-slate-900/50 border-gray-200/60 dark:border-white/10'
            } transition`}>              
              {p.highlight && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
              )}
              <div className="p-7 flex flex-col flex-1">
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-slate-100">{p.name}</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-5">
                  {p.price} <span className="text-base font-medium text-gray-500 dark:text-slate-400">{p.period}</span>
                </div>
                <ul className="text-sm text-gray-600 dark:text-slate-300 space-y-2 mb-6 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex gap-2 items-start">
                      <span className="text-brand-600 dark:text-brand-400 mt-0.5">✔</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full font-semibold py-3 rounded-xl transition relative overflow-hidden ${
                  p.highlight ? 'bg-brand-600 text-white hover:bg-brand-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20'
                }`}>
                  {p.cta}
                </button>
              </div>
              {p.highlight && (
                <div className="absolute -z-10 inset-0 opacity-30 animate-pulse" style={{ background: "radial-gradient(circle at 30% 30%, rgba(233,74,111,0.55), transparent 70%)" }} />
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
