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
    <section id="testimonials" aria-labelledby="testimonials-heading" className="py-28 bg-white relative">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.15) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="testimonials-heading"
          align="center"
          badge="Testimonios"
          badgeTone="sun"
          title="Lo que dicen otros"
          subtitle="Equipos que ya redujeron esperas y organizaron su operación." />
        <div className="grid gap-8 md:grid-cols-3 mt-12">
          {testimonials.map((t, i) => (
            <figure
              key={t.quote}
              className="group relative rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-sm p-6 flex flex-col shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* subtle gradient bar */}
              <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[var(--fc-brand-400)] via-[var(--fc-teal-400)] to-[var(--fc-sun-400)] opacity-80" />
              <blockquote className="text-[15px] leading-relaxed text-gray-700 italic mb-5 relative">
                <span aria-hidden className="select-none text-[var(--fc-brand-400)] font-serif text-xl align-top mr-1">“</span>
                {t.quote}
                <span aria-hidden className="select-none text-[var(--fc-brand-400)] font-serif text-xl ml-1">”</span>
              </blockquote>
              <figcaption className="mt-auto flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--fc-brand-100)] to-[var(--fc-teal-100)] ring-1 ring-inset ring-gray-200/60 flex items-center justify-center text-[11px] font-medium text-[var(--fc-brand-600)]">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 tracking-tight text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
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
