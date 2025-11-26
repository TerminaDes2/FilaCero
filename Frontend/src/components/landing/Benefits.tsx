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
    <section
      id="benefits"
      aria-labelledby="benefits-heading"
      className="relative overflow-hidden py-24 bg-[var(--fc-surface-base)] text-[var(--fc-text-primary)]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,23,42,0.08) 1px, transparent 0)',
          backgroundSize: '18px 18px',
          opacity: 0.05,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-transparent dark:from-slate-950/60 dark:via-slate-950/30 dark:to-transparent" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="benefits-heading"
          align="center"
          badge="Beneficios"
          badgeTone="teal"
          title="Impacto que puedes esperar"
          subtitle="Beneficios prácticos al digitalizar pedidos y la operación de tu cafetería." />
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Lista de resultados">
          {benefits.map((b, idx) => (
            <li
              key={b.title}
              className="relative group rounded-2xl border border-gray-200/70 bg-white/85 backdrop-blur-sm overflow-hidden transition-shadow hover:shadow-lg focus-within:shadow-lg dark:border-white/10 dark:bg-slate-900/60 dark:hover:shadow-brand-950/40"
            >
              {/* Accent gradient strip */}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[var(--fc-brand-400)] via-[var(--fc-teal-400)] to-[var(--fc-sun-400)] opacity-80" />
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-start gap-3 mb-2.5">
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--fc-brand-50)] to-[var(--fc-teal-50)] ring-1 ring-inset ring-gray-200/70 text-[11px] font-medium text-[var(--fc-brand-600)] group-hover:shadow-sm transition dark:from-[rgba(233,74,111,0.16)] dark:to-[rgba(76,193,173,0.18)] dark:ring-white/15 dark:text-[var(--fc-brand-100)]"
                  >
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold tracking-tight text-sm text-gray-800 group-hover:text-[var(--fc-brand-600)] transition-colors dark:text-slate-100 dark:group-hover:text-[var(--fc-brand-200)]">
                    {b.title}
                  </h3>
                </div>
                <p className="text-[13px] leading-relaxed text-gray-600 flex-1 dark:text-slate-300">
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
