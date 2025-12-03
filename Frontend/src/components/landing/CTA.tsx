"use client";
import Link from "next/link";
import { useTranslation } from "../../hooks/useTranslation";

export function CTA() {
  const { t } = useTranslation();
  return (
    <section id="cta" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600" aria-hidden="true" />
      <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent 60%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.6), transparent 65%)' }} aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 tracking-tight">{t("landing.cta.title")}</h2>
        <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
          {t("landing.cta.subtitle")}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/auth/register" className="bg-white text-brand-700 font-semibold px-8 py-3 rounded-full shadow-sm hover:shadow-md transition">
            {t("landing.cta.primary")}
          </Link>
          <Link href="/shop" className="bg-white/10 border border-white/30 backdrop-blur px-8 py-3 rounded-full font-semibold hover:bg-white/15 transition">
            {t("landing.cta.secondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
