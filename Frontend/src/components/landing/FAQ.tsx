"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SectionHeading } from '../../components/SectionHeading';

interface QA { q: string; a: string; }

const faqs: QA[] = [
  {
    q: '¿Necesito instalar algo o descargar una app?',
    a: 'No. Funciona directamente en el navegador (web app). Tus clientes solo escanean el QR y empiezan a pedir.'
  },
  {
    q: '¿Cuánto tardo en configurarlo?',
    a: 'En minutos puedes cargar tu catálogo base. A partir de ahí gestionas productos, precios y pedidos desde el panel.'
  },
  {
    q: '¿Funciona en cualquier dispositivo?',
    a: 'Sí. Está optimizado para móviles, tablets y desktops modernos sin requisitos especiales.'
  },
  {
    q: '¿Puedo migrar a funciones avanzadas luego?',
    a: 'Sí. Empiezas gratis y habilitas módulos como inventario avanzado o reportes profundos cuando los necesites.'
  }
];

interface FAQItemProps {
  index: number;
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
}

// Animación height -> auto: usamos medición + transición manual.
const FAQItem: React.FC<FAQItemProps> = ({ index, q, a, isOpen, onToggle }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const firstRenderRef = useRef(true);

  const animate = useCallback((open: boolean) => {
    const el = wrapperRef.current;
    const content = innerRef.current;
    if (!el || !content) return;

    // Cancel any previous cleanup
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const currentHeight = el.offsetHeight; // numeric
    const targetHeight = open ? content.offsetHeight : 0;

    // If first render just snap without animation.
    if (firstRenderRef.current || prefersReduced) {
      el.style.transition = 'none';
      el.style.height = open ? 'auto' : '0px';
      el.style.opacity = open ? '1' : '0';
      content.style.transition = 'none';
      content.style.transform = 'translateY(0)';
      content.style.opacity = open ? '1' : '0';
      // Force reflow then clear inline transition if needed
      void el.offsetHeight;
      el.style.transition = '';
      content.style.transition = '';
      firstRenderRef.current = false;
      return;
    }

    // Adaptive duration based on height difference
    const delta = Math.abs(targetHeight - currentHeight);
    const base = 160; // ms
    const extra = Math.min(260, delta * 0.6); // cap extra
    const duration = Math.round(base + extra); // 160 - 420ms aprox

    const heightEasing = open ? 'cubic-bezier(.22,.95,.36,1)' : 'cubic-bezier(.55,.05,.67,.19)';
    const fadeDuration = Math.min(260, duration - 40);

    // Prepare start state (FLIP): ensure we start from current explicit height
    el.style.height = currentHeight + 'px';
    el.style.opacity = open ? '0' : '1';
    el.style.overflow = 'hidden';
    el.style.willChange = 'height, opacity';
    content.style.willChange = 'transform, opacity';
    content.style.transition = 'none';
    if (open) {
      content.style.transform = 'translateY(4px)';
      content.style.opacity = '0';
    } else {
      content.style.transform = 'translateY(0)';
      content.style.opacity = '1';
    }

    // Double rAF to ensure styles are committed
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        el.style.transition = `height ${duration}ms ${heightEasing}, opacity ${fadeDuration}ms ease-out`;
        content.style.transition = `transform ${Math.min(duration - 40, 340)}ms ${open ? 'cubic-bezier(.16,1,.3,1)' : 'cubic-bezier(.55,.05,.67,.19)'}, opacity ${fadeDuration}ms ease-out`;
        // Trigger end state
        el.style.height = targetHeight + 'px';
        el.style.opacity = open ? '1' : '0';
        content.style.transform = open ? 'translateY(0)' : 'translateY(-2px)';
        content.style.opacity = open ? '1' : '0';
      });
      cancelRef.current = () => cancelAnimationFrame(raf2);
    });
    cancelRef.current = () => cancelAnimationFrame(raf1);

    const handleEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'height') return; // only once
      el.removeEventListener('transitionend', handleEnd);
      // Cleanup
      if (open) {
        el.style.height = 'auto';
      }
      el.style.willChange = '';
      el.style.transition = '';
      content.style.willChange = '';
      content.style.transition = '';
    };
    el.addEventListener('transitionend', handleEnd);
    firstRenderRef.current = false;
  }, []);

  useEffect(() => {
    animate(isOpen);
  }, [isOpen, animate]);

  return (
    <li className="border border-gray-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-slate-900/60 backdrop-blur overflow-hidden transition-shadow hover:shadow-sm focus-within:shadow-md">
      <button
        id={`faq-btn-${index}`}
        type="button"
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${index}`}
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left px-5 py-4 gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <span className="font-medium text-sm text-gray-800 dark:text-slate-100 pr-2">
          {q}
        </span>
        <span
          aria-hidden
          className="relative w-6 h-6 flex items-center justify-center text-brand-600 dark:text-brand-400"
        >
          <span className={`absolute block h-0.5 w-3.5 rounded bg-current transition-transform duration-300 ${isOpen ? 'rotate-180 scale-x-0' : 'scale-x-100'}`} />
          <span className={`absolute block h-0.5 w-3.5 rounded bg-current transition-transform duration-300 ${isOpen ? 'rotate-0' : 'rotate-90'}`} />
        </span>
      </button>
      <div
        id={`faq-panel-${index}`}
        role="region"
        aria-labelledby={`faq-btn-${index}`}
        ref={wrapperRef}
        style={{ height: 0, opacity: 0 }}
        className="px-5 pb-3"
      >
        <div ref={innerRef} className="pt-1">
          <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed max-w-2xl">{a}</p>
        </div>
      </div>
    </li>
  );
};

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-28 relative overflow-hidden bg-white dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.15) 1px, transparent 0)', backgroundSize: '18px 18px' }} />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="faq-heading"
          align="center"
          badge="FAQ"
          badgeTone="teal"
          title="Preguntas frecuentes"
          subtitle="Resolvemos dudas clave antes de que empieces." />
        <ul className="space-y-4" role="list">
          {faqs.map((f, i) => (
            <FAQItem
              key={f.q}
              index={i}
              q={f.q}
              a={f.a}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

export default FAQ;
