"use client";
import Link from "next/link";
import { useTranslation } from "../../hooks/useTranslation";

export function Footer() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();
  return (
    <footer className="relative bg-slate-950 text-slate-300 pt-16 pb-10" role="contentinfo">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-600/60 to-transparent" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4 mb-12">
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t("landing.footer.about.title")}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t("landing.footer.about.text")}
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">{t("landing.footer.product.title")}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-brand-300">{t("landing.footer.product.features")}</a></li>
              <li><a href="#pricing" className="hover:text-brand-300">{t("landing.footer.product.pricing")}</a></li>
              <li><a href="#process" className="hover:text-brand-300">{t("landing.footer.product.process")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">{t("landing.footer.resources.title")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/productos" className="hover:text-brand-300">{t("landing.footer.resources.panel")}</Link></li>
              <li><a href="#cta" className="hover:text-brand-300">{t("landing.footer.resources.start")}</a></li>
              <li><a href="#testimonials" className="hover:text-brand-300">{t("landing.footer.resources.testimonials")}</a></li>
              <li><Link href="/login" className="hover:text-brand-300">{t("landing.footer.resources.login")}</Link></li>
              <li><Link href="/register" className="hover:text-brand-300">{t("landing.footer.resources.register")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">{t("landing.footer.legal.title")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terminos" className="hover:text-brand-300">{t("landing.footer.legal.terms")}</Link></li>
              <li><Link href="/legal/privacidad" className="hover:text-brand-300">{t("landing.footer.legal.privacy")}</Link></li>
              <li><a href="mailto:contacto@filacero.app" className="hover:text-brand-300">{t("landing.footer.legal.contact")}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© {year} FilaCero. {t("landing.footer.copyright")}</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <a href="mailto:soporte@filacero.app" className="hover:text-brand-300">{t("landing.footer.support.support")}</a>
            <a href="https://status.filacero.app" target="_blank" rel="noopener noreferrer" className="hover:text-brand-300">{t("landing.footer.support.status")}</a>
            <a href="https://roadmap.filacero.app" target="_blank" rel="noopener noreferrer" className="hover:text-brand-300">{t("landing.footer.support.roadmap")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
