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
      className={`fixed inset-0 z-[999] flex items-start md:items-center justify-center overflow-y-auto md:overflow-hidden bg-slate-900/45 backdrop-blur-sm transition-opacity duration-150 ${open? 'opacity-100' : 'opacity-0'}`}
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={doc.label}
        className={`relative w-full md:w-[960px] xl:w-[1040px] max-w-[96vw] mt-8 md:mt-0 rounded-2xl border border-white/15 bg-gradient-to-br from-white/95 to-white/80 shadow-[0_4px_40px_-4px_rgba(0,0,0,0.45)] backdrop-blur-2xl overflow-hidden flex flex-col transition-all duration-200 ${open? 'data-open' : ''}`}
      >
        <header className="flex items-center gap-3 px-5 py-4 border-b border-black/5 bg-white/60 backdrop-blur-md">
          <nav aria-label="Documentos legales" className="flex gap-1">
            {(['terminos','privacidad'] as LegalSlug[]).map(slug => {
              const activeTab = active === slug;
              const label = legalDocuments[slug].label.split(' ')[0];
              return (
                <button
                  key={slug}
                  onClick={()=>switchTab(slug)}
                  className={`relative px-3.5 py-1.5 rounded-md text-xs font-semibold tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 ${activeTab ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200/70'}`}
                >
                  {label}
                  {activeTab && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-brand-400/0 via-brand-200 to-brand-400/0" />}
                </button>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:text-slate-900 hover:bg-gray-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              aria-label="Cerrar"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2" fill="none"><path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" /></svg>
            </button>
          </div>
        </header>
        <div className="flex flex-col md:flex-row min-h-[560px] max-h-[80vh]">
          <aside className="hidden md:block w-52 flex-shrink-0 border-r border-black/5 px-4 py-5 overflow-y-auto" data-legal-scroll>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-3">Índice</p>
            <ul className="space-y-1.5 text-[12px]">
              {doc.sections.map((s: LegalSection) => (
                <li key={s.id}>
                  <a href={`#modal-${s.id}`} className="group flex items-start gap-2 rounded px-2 py-1 hover:bg-brand-50 text-gray-600 hover:text-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-400/60">
                    <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-gray-300/70 group-hover:bg-brand-500" />
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8 text-sm leading-relaxed" data-legal-scroll>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-slate-800">{doc.label}</h2>
              <p className="text-[11px] text-gray-500">Actualizado: {doc.updated}</p>
              <div className="prose prose-xs max-w-none">
                {doc.intro}
              </div>
            </div>
            <div className="space-y-8">
              {doc.sections.map((section: LegalSection) => (
                <section key={section.id} id={`modal-${section.id}`} className="prose prose-xs max-w-none scroll-mt-20">
                  <h3 className="!mt-0">{section.title}</h3>
                  {section.body}
                </section>
              ))}
            </div>
            <div className="border-t pt-5 mt-4">
              <div className="prose prose-xs max-w-none">
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
