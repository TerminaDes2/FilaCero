import { Reveal } from "../../components/Reveal";

interface Feature {
  title: string;
  description: string;
  color: string; // hex color for circle background
  icon: JSX.Element; // inline SVG icon
}

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 2,
  stroke: "white",
  className: "w-6 h-6",
  "aria-hidden": true as const
};

const features: Feature[] = [
  {
    title: "Ventas rápidas y simples",
    description: "Cobra en segundos con una interfaz ágil para POS.",
    color: "#148987",
    icon: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    title: "Impresión inmediata de tickets",
    description: "Envía tickets al instante a la impresora compatible.",
    color: "#318914",
    icon: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
        <rect x="5" y="9" width="14" height="6" rx="2" ry="2" strokeWidth="2" />
        <path strokeLinecap="round" d="M8 15h8M9 12h6" />
      </svg>
    )
  },
  {
    title: "Corte automático de caja",
    description: "Cierra turnos con totales y arqueo automáticos.",
    color: "#897D14",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="7" width="18" height="10" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        <path strokeLinecap="round" d="M7 12h10M7 15h4" />
      </svg>
    )
  },
  {
    title: "Gestión de productos con código de barras",
    description: "Agrega y busca productos escaneando códigos.",
    color: "#891468",
    icon: (
      <svg {...iconProps}>
        <path d="M4 6v12M7 6v12M10 6v12M12 6v12M15 6v12M18 6v12" />
      </svg>
    )
  },
  {
    title: "Promociones personalizadas",
    description: "Crea combos, descuentos y reglas por horario.",
    color: "#894F14",
    icon: (
      <svg {...iconProps}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l10 10" />
        <circle cx="7" cy="7" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    )
  },
  {
    title: "Pedidos digitales sin filas",
    description: "Ordena desde el móvil y recoge sin esperar.",
    color: "#891414",
    icon: (
      <svg {...iconProps}>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path strokeLinecap="round" d="M10 6h6M10 10h6M10 14h4" />
      </svg>
    )
  }
];

export function Features() {
  return (
    <section id="features" className="py-28 relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Colored radial accents */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ background: "radial-gradient(circle at 30% 30%, rgba(233,74,111,0.15), transparent 60%), radial-gradient(circle at 70% 20%, rgba(76,193,173,0.12), transparent 65%)" }} />
      {/* Subtle dot grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.10) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl mb-14 text-center mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 mb-3">
            Beneficios clave
          </span>
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Un sistema diseñado para tu cafetería: <span style={{ color: '#54C7EE' }}>simple</span>, <span style={{ color: '#E2A81B' }}>ágil</span> y <span style={{ color: '#EE5454' }}>confiable</span>.
          </h2>
          <p className="text-gray-600 dark:text-slate-300">Todo lo que necesitas para una operación organizada y sin fricción.</p>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f,i) => (
            <Reveal delay={80*i} key={f.title} className="relative group">
              {/* Hover tinted glow */}
              <div className="pointer-events-none absolute -z-10 -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-[0.20] transition duration-500" style={{ background: f.color }} />
              <div
                className="relative h-full p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-sm ring-1 ring-white/40 dark:ring-white/10 hover:shadow-lg transition transform group-hover:-translate-y-1"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${f.color}0F, transparent 60%)`
                }}
              >
                {/* Gradient border accent */}
                <div className="absolute inset-[1px] rounded-[1rem] pointer-events-none border border-white/40 dark:border-white/5" />
                <div className="absolute inset-x-0 top-0 h-1 opacity-30 group-hover:opacity-60 transition" style={{ background: `linear-gradient(90deg, ${f.color}22, ${f.color})` }} />
                <div className="absolute -top-12 -right-10 w-44 h-44 rounded-full blur-2xl" style={{ backgroundColor: f.color, opacity: 0.10 }} />
                {/* Icon */}
                <div className="mb-5 relative">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm ring-2 ring-white/60 dark:ring-white/10 relative overflow-hidden bg-gradient-to-br" style={{ background: f.color }} aria-hidden='true'>
                    <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 70%)' }} />
                    {f.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-slate-100 tracking-tight">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed relative z-10">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
