"use client";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "../../components/Reveal";
import BackgroundSquares from "./BackgroundSquares";
import { useTranslation } from "../../hooks/useTranslation";

export function Hero() {
  const { t } = useTranslation();
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative min-h-[90vh] md:min-h-[100dvh] pt-28 sm:pt-32 md:pt-40 pb-20 flex items-center overflow-hidden bg-app-gradient"
    >
      {/* Background rotated squares within hero */}
      <BackgroundSquares />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center">
          <Reveal className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-[0.42em] text-brand-700 shadow-sm">
              {t("landing.hero.badge")}
            </span>
            <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {t("landing.hero.title")} <span className="text-gradient">{t("landing.hero.titleHighlight")}</span>.
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              {t("landing.hero.subtitle")}
            </p>
            {/* Social proof inline */}
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="inline-flex -space-x-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 border border-white" aria-hidden="true" />
                <span className="w-6 h-6 rounded-full bg-amber-400 border border-white" aria-hidden="true" />
                <span className="w-6 h-6 rounded-full bg-teal-500 border border-white" aria-hidden="true" />
              </span>
              <span className="text-xs sm:text-sm">Escuelas piloto ya operando sin filas</span>
            </p>
            {/* Metrics semantic list */}
            <ul className="flex flex-wrap gap-2 pt-1" aria-label="Indicadores clave">
              {[
                { label: "< 5s orden", desc: "flujo optimizado" },
                { label: "100% responsive", desc: "móvil primero" },
                { label: "Sin descargas", desc: "solo escanear" }
              ].map(item => (
                <li key={item.label} className="group relative rounded-full px-4 py-1.5 bg-white/70 backdrop-blur border border-white/60 text-[11px] font-medium text-gray-700 flex items-center gap-2 shadow-sm">
                  <span className="text-brand-600" aria-hidden="true">●</span>
                  <span>{item.label}</span>
                  <span className="sr-only">{item.desc}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4 items-center">
              <Link href="/register" className="group relative inline-flex items-center gap-2 bg-brand-600 text-white px-7 py-3 rounded-full font-semibold shadow-glow hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 transition">
                <span>{t("landing.hero.ctaPrimary")}</span>
                <span className="translate-x-0 group-hover:translate-x-1 transition" aria-hidden="true">→</span>
              </Link>
              <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border border-gray-300/70 text-gray-700 hover:border-brand-500 hover:text-brand-600 dark:text-gray-200 dark:border-white/15 dark:hover:border-brand-400 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 transition">
                {t("landing.hero.ctaSecondary")}
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-brand-600 hover:underline">
                {t("navbar.pricing")}
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 pt-2">
              <ul className="text-sm text-gray-600 space-y-1" aria-label="Ventajas principales">
                <li className="flex items-start gap-2"><span className="text-brand-600" aria-hidden="true">✔</span><span>Implementación sin fricción</span></li>
                <li className="flex items-start gap-2"><span className="text-brand-600" aria-hidden="true">✔</span><span>Funciona en cualquier dispositivo</span></li>
                <li className="flex items-start gap-2"><span className="text-brand-600" aria-hidden="true">✔</span><span>Optimizado para recreos cortos</span></li>
              </ul>
              <p className="text-xs text-gray-500 max-w-xs">
                <strong className="font-semibold text-gray-700">Sin tarjeta</strong> ni compromisos. Accede a todo el núcleo operativo gratis y agrega servicios opcionales cuando los necesites.
              </p>
            </div>
            <p className="text-sm text-gray-600 pt-1">
              {/* Mantener la pregunta en español por ahora; solo el link traducido */}
              ¿Ya tienes cuenta? <Link href="/login" className="font-medium text-brand-600 hover:underline">{t("navbar.login")}</Link>
            </p>
          </Reveal>
          <Reveal delay={120} className="relative hidden sm:block">
            <div className="absolute -inset-4 rounded-3xl border border-white/70 bg-white/60 backdrop-blur" />
            <div className="relative rounded-3xl bg-white shadow-xl ring-1 ring-white/60 overflow-hidden">
              <div className="absolute -top-24 -right-20 h-56 w-56 rounded-full bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 opacity-30 blur-2xl" aria-hidden />
              <div className="relative grid gap-6 p-6 sm:p-8">
                <div className="relative rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <Image
                    src="/images/POS-OrdenarMenu.png"
                    width={900}
                    height={620}
                    priority
                    alt="Vista previa del POS FilaCero mostrando la pantalla de ordenar"
                    className="w-full h-auto"
                  />
                  <span className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-600 shadow">Turno actual</span>
                </div>
                <div className="hidden sm:grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      title: t("landing.cards.card1.title"),
                      metric: t("landing.cards.card1.metric"),
                      badge: t("landing.cards.card1.badge"),
                    },
                    {
                      title: t("landing.cards.card2.title"),
                      metric: t("landing.cards.card2.metric"),
                      badge: t("landing.cards.card2.badge"),
                    },
                    {
                      title: t("landing.cards.card3.title"),
                      metric: t("landing.cards.card3.metric"),
                      badge: t("landing.cards.card3.badge"),
                    },
                    {
                      title: t("landing.cards.card4.title"),
                      metric: t("landing.cards.card4.metric"),
                      badge: t("landing.cards.card4.badge"),
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-white via-white to-brand-50/30 p-4 shadow-sm"
                    >
                      <span className="text-[11px] font-medium uppercase tracking-wide text-brand-500" aria-hidden>
                        {card.badge}
                      </span>
                      <p className="mt-1 text-sm font-semibold text-gray-800">{card.title}</p>
                      <p className="text-2xl font-semibold text-gray-900">{card.metric}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
