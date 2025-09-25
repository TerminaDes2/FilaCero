import type { Metadata } from 'next';
import Link from 'next/link';
import { terminos, LegalSection } from '../../../src/legal/content';

export const metadata: Metadata = {
  title: 'Términos de Servicio | FilaCero',
  description: 'Condiciones de uso de la plataforma FilaCero.'
};

export default function TerminosPage() {
  const doc = terminos;
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="mb-10 flex flex-col gap-4 md:gap-6">
        <div>
          <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 dark:bg-brand-400/10 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-400/20 px-2 py-1 text-[11px] font-medium tracking-wide">LEGAL</span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">{doc.label}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Última actualización: {doc.updated}</p>
        </div>
        <div className="grid md:grid-cols-[220px_1fr] gap-10">
          <aside className="hidden md:block">
            <nav className="sticky top-28 text-[13px] space-y-2">
              <p className="uppercase font-semibold tracking-wider text-gray-400 dark:text-slate-500 mb-2">Contenido</p>
              <ul className="space-y-1.5">
                {doc.sections.map((s: LegalSection) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block px-2 py-1 rounded hover:bg-brand-50/70 dark:hover:bg-white/5 text-gray-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-400">
                      {s.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#contacto" className="block px-2 py-1 rounded hover:bg-brand-50/70 dark:hover:bg-white/5 text-gray-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-400">9. Contacto</a>
                </li>
              </ul>
            </nav>
          </aside>
          <article className="prose dark:prose-invert prose-sm max-w-none">
            {doc.intro}
            {doc.sections.map((section: LegalSection) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2>{section.title}</h2>
                {section.body}
              </section>
            ))}
            <p className="mt-8">Para la Política de Privacidad visita <Link href="/legal/privacidad" className="text-brand-600 dark:text-brand-400 font-medium">esta página →</Link></p>
            <div className="mt-10 border-t pt-6">
              {doc.disclaimer}
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
