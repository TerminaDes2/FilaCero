import { SectionHeading } from "../../components/SectionHeading";

const testimonials = [
  {
    name: "Coordinadora Escolar",
    quote: "Reducimos el tiempo de espera y ahora los recreos son más tranquilos.",
    role: "Colegio Aurora",
  },
  {
    name: "Administrador",
    quote: "El control de inventario nos permitió evitar pérdidas y planificar mejor.",
    role: "Instituto Central",
  },
  {
    name: "Encargada Cafetería",
    quote: "La interfaz es tan simple que el equipo se adaptó en un día.",
    role: "Escuela Horizonte",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden py-28 bg-[var(--fc-surface-base)] text-[var(--fc-text-primary)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(rgba(15,23,42,0.14) 1px, transparent 0)', backgroundSize: '18px 18px' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-white/30 to-transparent dark:from-slate-950/70 dark:via-slate-950/35 dark:to-transparent" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="testimonials-heading"
          align="center"
          badge="Testimonios"
          badgeTone="sun"
          title="Lo que dicen otros"
          subtitle="Equipos que ya redujeron esperas y organizaron su operación." />
        <div className="mt-12 flex gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible snap-x snap-mandatory" role="list">
          {testimonials.map((t, i) => (
            <figure
              key={t.quote}
              className="group relative min-w-[260px] snap-start rounded-2xl border border-gray-200/70 bg-white/85 backdrop-blur-sm p-6 flex flex-col shadow-sm hover:shadow-lg transition-shadow md:min-w-0 dark:border-white/10 dark:bg-slate-900/60 dark:hover:shadow-brand-950/40"
            >
              {/* subtle gradient bar */}
              <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[var(--fc-brand-400)] via-[var(--fc-teal-400)] to-[var(--fc-sun-400)] opacity-80" />
              <blockquote className="text-[15px] leading-relaxed text-gray-700 italic mb-5 relative dark:text-slate-200">
                <span aria-hidden className="select-none text-[var(--fc-brand-400)] font-serif text-xl align-top mr-1 dark:text-[var(--fc-brand-200)]">“</span>
                {t.quote}
                <span aria-hidden className="select-none text-[var(--fc-brand-400)] font-serif text-xl ml-1 dark:text-[var(--fc-brand-200)]">”</span>
              </blockquote>
              <figcaption className="mt-auto flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--fc-brand-100)] to-[var(--fc-teal-100)] ring-1 ring-inset ring-gray-200/60 flex items-center justify-center text-[11px] font-medium text-[var(--fc-brand-600)] dark:from-[rgba(233,74,111,0.14)] dark:to-[rgba(76,193,173,0.15)] dark:ring-white/10 dark:text-[var(--fc-brand-100)]">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 tracking-tight text-sm dark:text-slate-100">{t.name}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">{t.role}</div>
                </div>
              </figcaption>
              <span aria-hidden className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-tr from-[var(--fc-brand-400)]/10 via-[var(--fc-teal-400)]/10 to-transparent blur-2xl opacity-0 group-hover:opacity-70 transition duration-500" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
