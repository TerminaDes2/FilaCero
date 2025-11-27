"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { legalDocuments, LegalSlug, LegalSection } from '../../legal/content';

interface LegalModalProps {
  open: boolean;
  initialTab?: LegalSlug;
  onClose: () => void;
}

// Basic focus trap util
function useFocusTrap(enabled: boolean, containerRef: React.RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    if(!enabled) return;
    const container = containerRef.current;
    if(!container) return;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    ));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const prevActive = document.activeElement as HTMLElement | null;
    first?.focus();
    function handleKey(e: KeyboardEvent) {
      if(e.key === 'Escape') { e.preventDefault(); onClose(); }
      if(e.key === 'Tab') {
        if(focusable.length === 0) return;
        if(e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      prevActive?.focus();
    };
  }, [enabled, containerRef, onClose]);
}

export const LegalModal: React.FC<LegalModalProps> = ({ open, initialTab = 'terminos', onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<LegalSlug>(initialTab);
  const [animState, setAnimState] = useState<'enter' | 'idle' | 'exit' | null>(null);
  const [mounted, setMounted] = useState(false);

  // Detect mount for portal safety
  useEffect(()=> { setMounted(true); }, []);

  // Reset active tab whenever opening with a different initialTab
  useEffect(()=>{ if(open) setActive(initialTab); }, [open, initialTab]);

  // Handle opening transitions
  useEffect(() => {
    if (!open) return;
    setAnimState('enter');
    const id = requestAnimationFrame(() => setAnimState('idle'));
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Handle closing transitions
  useEffect(() => {
    if (open || animState === null) return;
    setAnimState('exit');
    const t = setTimeout(() => setAnimState(null), 160);
    return () => clearTimeout(t);
  }, [open, animState]);

  const handleBackdrop = (e: React.MouseEvent) => {
    if(e.target === backdropRef.current) onClose();
  };

  useFocusTrap(!!open, dialogRef, onClose);

  const doc = legalDocuments[active];

  const switchTab = useCallback((slug: LegalSlug) => {
    setActive(slug);
    // scroll container top
    const scroller = dialogRef.current?.querySelector('[data-legal-scroll]') as HTMLElement | undefined;
    if(scroller) scroller.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Prevent background scroll while open
  useEffect(()=> {
    if(open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previous; };
    }
  }, [open]);

  if(!mounted || animState === null) return null;
  const node = (
    <div
      ref={backdropRef}
      onMouseDown={handleBackdrop}
      className={`fixed inset-0 z-[999] flex items-start md:items-center justify-center overflow-y-auto md:overflow-hidden bg-slate-900/45 backdrop-blur-sm transition-opacity duration-150 dark:bg-slate-950/80 ${open? 'opacity-100' : 'opacity-0'}`}
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={doc.label}
        className={`relative w-full md:w-[960px] xl:w-[1040px] max-w-[96vw] mt-8 md:mt-0 flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/96 via-white/92 to-white/85 text-slate-900 shadow-[0_30px_60px_-35px_rgba(15,23,42,0.65)] backdrop-blur-2xl transition-all duration-200 dark:border-slate-800/60 dark:from-slate-950/96 dark:via-slate-950/94 dark:to-slate-950/98 dark:text-slate-200 dark:shadow-[0_40px_90px_-35px_rgba(8,8,22,0.9)] ${open? 'data-open' : ''}`}
      >
        <header className="flex items-center gap-3 border-b border-black/5 bg-white/65 px-5 py-4 backdrop-blur-md transition-colors dark:border-slate-800/70 dark:bg-slate-950/80">
          <nav aria-label="Documentos legales" className="flex gap-1">
            {(['terminos','privacidad'] as LegalSlug[]).map(slug => {
              const activeTab = active === slug;
              const label = legalDocuments[slug].label.split(' ')[0];
              return (
                <button
                  key={slug}
                  onClick={()=>switchTab(slug)}
                  className={`relative rounded-md px-3.5 py-1.5 text-xs font-semibold tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 dark:focus-visible:ring-brand-300/70 ${activeTab ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500/90' : 'text-gray-600 hover:bg-gray-200/70 dark:text-slate-300 dark:hover:bg-slate-800/80'}`}
                >
                  {label}
                  {activeTab && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-brand-400/0 via-brand-200 to-brand-400/0 dark:from-brand-300/0 dark:via-brand-200/70 dark:to-brand-300/0" />}
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-200/60 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 dark:focus-visible:ring-brand-300"
              aria-label="Cerrar"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2" fill="none"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" /></svg>
            </button>
          </div>
        </header>
        <div className="flex min-h-[560px] max-h-[80vh] flex-col md:flex-row">
          <aside className="hidden w-52 flex-shrink-0 border-r border-black/5 px-4 py-5 transition-colors md:block dark:border-slate-800/60" data-legal-scroll>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Índice</p>
            <ul className="space-y-1.5 text-[12px]">
              {doc.sections.map((s: LegalSection) => (
                <li key={s.id}>
                  <a href={`#modal-${s.id}`} className="group flex items-start gap-2 rounded px-2 py-1 text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-400/60 dark:text-slate-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-300 dark:focus:ring-brand-300/60">
                    <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-gray-300/70 transition-colors group-hover:bg-brand-500 dark:bg-slate-700/80 dark:group-hover:bg-brand-300" />
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
          <div className="flex-1 space-y-8 overflow-y-auto bg-white/20 px-5 py-6 text-sm leading-relaxed transition-colors dark:bg-slate-950/30" data-legal-scroll>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">{doc.label}</h2>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">Actualizado: {doc.updated}</p>
              <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                {doc.intro}
              </div>
            </div>
            <div className="space-y-8">
              {doc.sections.map((section: LegalSection) => (
                <section key={section.id} id={`modal-${section.id}`} className="prose prose-sm prose-slate max-w-none scroll-mt-20 dark:prose-invert">
                  <h3 className="!mt-0">{section.title}</h3>
                  {section.body}
                </section>
              ))}
            </div>
            <div className="mt-4 border-t pt-5 dark:border-slate-800/70">
              <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                {doc.disclaimer}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
};
