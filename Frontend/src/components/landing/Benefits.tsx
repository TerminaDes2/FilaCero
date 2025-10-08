import { SectionHeading } from "../../components/SectionHeading";

const benefits = [
  {
    title: "Menos tiempo en filas",
    text: "Optimización del flujo de compra para estudiantes y personal.",
  },
  {
    title: "Control centralizado",
    text: "Toda la operación en una única plataforma coherente.",
  },
  {
    title: "Decisiones con datos",
    text: "Reportes claros para ajustar precios y stock.",
  },
  {
    title: "Escalable",
    text: "Empieza simple y agrega módulos con el crecimiento.",
  },
  {
    title: "Experiencia moderna",
    text: "UI limpia, rápida y accesible para cualquier usuario.",
  },
  {
    title: "Soporte futuro",
    text: "Base preparada para integrar pagos y más.",
  },
];

export function Benefits() {
  return (
    <section id="benefits" aria-labelledby="benefits-heading" className="py-24 bg-white relative">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.15) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="benefits-heading"
          align="center"
          badge="Beneficios"
          badgeTone="teal"
          title="Impacto que puedes esperar"
          subtitle="Beneficios prácticos al digitalizar pedidos y la operación de tu cafetería." />
        <ul className="grid gap-6 md:grid-cols-3" aria-label="Lista de resultados">
          {benefits.map((b, idx) => (
            <li
              key={b.title}
              className="relative group rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-sm overflow-hidden transition-shadow hover:shadow-lg focus-within:shadow-lg"
            >
              {/* Accent gradient strip */}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[var(--fc-brand-400)] via-[var(--fc-teal-400)] to-[var(--fc-sun-400)] opacity-80" />
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--fc-brand-50)] to-[var(--fc-teal-50)] ring-1 ring-inset ring-gray-200/70 text-[11px] font-medium text-[var(--fc-brand-600)] group-hover:shadow-sm transition"
                  >
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold tracking-tight text-sm text-gray-800 group-hover:text-[var(--fc-brand-600)] transition-colors">
                    {b.title}
                  </h3>
                </div>
                <p className="text-[13px] leading-relaxed text-gray-600 flex-1">
                  {b.text}
                </p>
              </div>
              <span aria-hidden className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-tr from-[var(--fc-brand-400)]/10 via-[var(--fc-teal-400)]/10 to-transparent blur-2xl opacity-0 group-hover:opacity-70 transition duration-500" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
