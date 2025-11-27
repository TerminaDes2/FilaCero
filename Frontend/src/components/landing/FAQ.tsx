"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SectionHeading } from '../../components/SectionHeading';
import { useTranslation } from '../../hooks/useTranslation';

interface QA { qKey: string; aKey: string; }

const faqs: QA[] = [
  { qKey: 'landing.faq.items.1.q', aKey: 'landing.faq.items.1.a' },
  { qKey: 'landing.faq.items.2.q', aKey: 'landing.faq.items.2.a' },
  { qKey: 'landing.faq.items.3.q', aKey: 'landing.faq.items.3.a' },
  { qKey: 'landing.faq.items.4.q', aKey: 'landing.faq.items.4.a' },
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
    <li className="rounded-xl border border-gray-200/70 bg-white/80 backdrop-blur overflow-hidden transition-shadow hover:shadow-sm focus-within:shadow-md dark:border-white/12 dark:bg-[color:rgba(10,15,28,0.82)] dark:hover:shadow-[0_32px_95px_-62px_rgba(15,20,35,0.95)]">
      <button
        id={`faq-btn-${index}`}
        type="button"
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${index}`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
      >
        <span className="pr-2 text-sm font-medium text-gray-800 dark:text-slate-100">
          {q}
        </span>
        <span
          aria-hidden
          className="relative flex h-6 w-6 items-center justify-center text-brand-600 dark:text-brand-200"
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
          <p className="max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-slate-200">{a}</p>
        </div>
      </div>
    </li>
  );
};

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const { t } = useTranslation();
  return (
    <section id="faq" aria-labelledby="faq-heading" className="relative overflow-hidden py-28 bg-[var(--fc-surface-base)] dark:bg-[color:rgba(3,7,15,0.97)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(rgba(148,163,184,0.2)_1px,transparent_0)] [background-size:18px_18px] dark:opacity-[0.18] dark:[background-image:radial-gradient(rgba(100,116,139,0.18)_1px,transparent_0)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 via-white/15 to-transparent dark:from-[color:rgba(2,5,12,0.94)] dark:via-[color:rgba(3,7,15,0.6)] dark:to-[color:rgba(3,7,15,0.92)]" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="faq-heading"
          align="center"
          badge={t('landing.faq.badge')}
          badgeTone="teal"
          title={t('landing.faq.title')}
          subtitle={t('landing.faq.subtitle')} />
        <ul className="space-y-4" role="list">
          {faqs.map((f, i) => (
            <FAQItem
              key={f.qKey}
              index={i}
              q={t(f.qKey)}
              a={t(f.aKey)}
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
