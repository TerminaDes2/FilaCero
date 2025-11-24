import { Reveal } from "../../components/Reveal";
import { SectionHeading } from "../../components/SectionHeading";

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element; // inline SVG icon (decorativo)
  accent?: string; // optional accent color token override
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

// Uso: colores unificados (brand / teal / sun) para mayor coherencia.
const features: Feature[] = [
  {
    title: "Ventas rápidas y simples",
    description: "Interfaz ágil para cobrar sin cuellos de botella.",
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    accent: 'var(--brand-accent, #e94a6f)'
  },
  {
    title: "Tickets inmediatos",
    description: "Envía e imprime tickets compatibles al instante.",
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
        <rect x="5" y="9" width="14" height="6" rx="2" ry="2" />
        <path strokeLinecap="round" d="M8 15h8M9 12h6" />
      </svg>
    ),
    accent: 'var(--brand-teal, #4cc1ad)'
  },
  {
    title: "Cierre de caja asistido",
    description: "Turnos con totales y arqueos automáticos.",
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <rect x="3" y="7" width="18" height="10" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
        <path strokeLinecap="round" d="M7 12h10M7 15h4" />
      </svg>
    ),
    accent: 'var(--brand-sun, #e2a81b)'
  },
  {
    title: "Inventario con códigos",
    description: "Agrega y busca productos escaneando códigos.",
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path d="M4 6v12M7 6v12M10 6v12M12 6v12M15 6v12M18 6v12" />
      </svg>
    )
  },
  {
    title: "Promos y combos",
    description: "Crea descuentos y reglas por horarios pico.",
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l10 10" />
        <circle cx="7" cy="7" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    )
  },
  {
    title: "Pedidos móviles sin filas",
    description: "Ordena desde el móvil y recoge sin esperar.",
    icon: (
      <svg {...iconProps} aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path strokeLinecap="round" d="M10 6h6M10 10h6M10 14h4" />
      </svg>
    )
  }
];

export function Features() {
  return (
  <section id="features" className="py-28 relative overflow-hidden bg-white" aria-labelledby="features-heading">
      {/* Colored radial accents */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ background: "radial-gradient(circle at 30% 30%, rgba(233,74,111,0.15), transparent 60%), radial-gradient(circle at 70% 20%, rgba(76,193,173,0.12), transparent 65%)" }} />
      {/* Subtle dot grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.10) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="features-heading"
          align="center"
          badge="Características"
          badgeTone="brand"
          title="Capacidades que aceleran tu operación"
          subtitle="Bloques funcionales listos para escalar cuando tu cafetería crece." />
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f,i) => {
            const accent = f.accent || 'var(--brand-accent, #e94a6f)';
            return (
              <Reveal delay={70*i} key={f.title} className="relative group">
                <div
                  className="relative h-full p-5 sm:p-6 rounded-2xl bg-white/85 backdrop-blur-xl overflow-hidden shadow-sm ring-1 ring-gray-200/60 hover:shadow-md transition">
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                  <div className="mb-4 sm:mb-5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-white/60 bg-gradient-to-br from-brand-500 to-brand-600 relative overflow-hidden" aria-hidden="true">
                      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), transparent 70%)' }} />
                      {f.icon}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold mb-1.5 text-gray-800 tracking-tight">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
