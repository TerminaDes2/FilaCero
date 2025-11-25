"use client";
import { SectionHeading } from "../../components/SectionHeading";
import { useTranslation } from "../../hooks/useTranslation";

const testimonials = [
  { nameKey: "landing.testimonials.items.1.name", quoteKey: "landing.testimonials.items.1.quote", roleKey: "landing.testimonials.items.1.role" },
  { nameKey: "landing.testimonials.items.2.name", quoteKey: "landing.testimonials.items.2.quote", roleKey: "landing.testimonials.items.2.role" },
  { nameKey: "landing.testimonials.items.3.name", quoteKey: "landing.testimonials.items.3.quote", roleKey: "landing.testimonials.items.3.role" },
];

export function Testimonials() {
  const { t } = useTranslation();
  return (
    <section id="testimonials" aria-labelledby="testimonials-heading" className="py-28 bg-white relative">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.15) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="testimonials-heading"
          align="center"
          badge={t("landing.testimonials.badge")}
          badgeTone="sun"
          title={t("landing.testimonials.title")}
          subtitle={t("landing.testimonials.subtitle")} />
        <div className="mt-12 flex gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible snap-x snap-mandatory" role="list">
          {testimonials.map((ti, i) => (
            <figure
              key={ti.quoteKey}
              className="group relative min-w-[260px] snap-start rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-sm p-6 flex flex-col shadow-sm hover:shadow-lg transition-shadow md:min-w-0"
            >
              {/* subtle gradient bar */}
              <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[var(--fc-brand-400)] via-[var(--fc-teal-400)] to-[var(--fc-sun-400)] opacity-80" />
              <blockquote className="text-[15px] leading-relaxed text-gray-700 italic mb-5 relative">
                <span aria-hidden className="select-none text-[var(--fc-brand-400)] font-serif text-xl align-top mr-1">“</span>
                {t(ti.quoteKey)}
                <span aria-hidden className="select-none text-[var(--fc-brand-400)] font-serif text-xl ml-1">”</span>
              </blockquote>
              <figcaption className="mt-auto flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--fc-brand-100)] to-[var(--fc-teal-100)] ring-1 ring-inset ring-gray-200/60 flex items-center justify-center text-[11px] font-medium text-[var(--fc-brand-600)]">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-gray-800 tracking-tight text-sm">{t(ti.nameKey)}</div>
                  <div className="text-xs text-gray-500">{t(ti.roleKey)}</div>
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
