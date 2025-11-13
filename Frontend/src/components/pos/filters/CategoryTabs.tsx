"use client";
import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';

interface CategoryTabsProps {
  categories: string[];
  value: string;
  onChange: (cat: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, value, onChange }) => {
  const tabs = useMemo(() => ['all', ...categories], [categories]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [ready, setReady] = useState(false); // enable transitions only after first paint

  const updateIndicator = () => {
    const idx = Math.max(0, tabs.findIndex(t => t === value));
    const btn = btnRefs.current[idx];
    const lbl = labelRefs.current[idx];
    const container = containerRef.current;
    if (btn && container) {
      // Position under the actual active button, independent of whether the container is centered
      const padLeft = parseFloat(getComputedStyle(container).paddingLeft || '0') || 0;
      const textOffset = lbl ? lbl.offsetLeft : 0;
      const left = btn.offsetLeft + textOffset - container.scrollLeft + padLeft;
      const width = lbl ? lbl.offsetWidth : btn.offsetWidth;
      setIndicator({ left, width });
    }
  };

  const centerActiveTab = () => {
    const idx = Math.max(0, tabs.findIndex(t => t === value));
    const btn = btnRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const target = btn.offsetLeft - (container.clientWidth - btn.offsetWidth) / 2;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const clamped = Math.max(0, Math.min(target, maxScroll));
    try {
      container.scrollTo({ left: clamped, behavior: 'smooth' });
    } catch {
      container.scrollLeft = clamped; // fallback
    }
  };

  // Measure on mount before paint so it appears in place without animating
  useLayoutEffect(() => {
    updateIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enable transitions after first paint to allow smooth tab changes but no load animation
  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    updateIndicator();
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    const el = containerRef.current;
    const onScroll = () => updateIndicator();
    el?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      el?.removeEventListener('scroll', onScroll as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, categories]);

  const onKeyNav = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const current = Math.max(0, tabs.findIndex(t => t === value));
    const nextIdx = e.key === 'ArrowRight' ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
    onChange(tabs[nextIdx]);
  };

  return (
    <div className="relative">
      {/* Tabs bar as folder tabs */}
      <div
        ref={containerRef}
        className="relative flex items-end gap-1.5 px-1.5 pt-1 overflow-x-auto overflow-y-hidden no-scrollbar"
        role="tablist"
        aria-label="Categorías de productos"
      >
        {/* Baseline under tabs */}
        <span className="absolute left-0 right-0 bottom-0 h-px" style={{ background: 'var(--pos-border-soft)' }} aria-hidden="true" />
        {/* Active tab slab (animated) */}
        <span
          className="absolute bottom-0 h-9 rounded-t-xl z-0"
          style={{
            left: indicator.left,
            width: indicator.width,
            transition: ready ? 'left 260ms cubic-bezier(.2,.8,.2,1), width 260ms cubic-bezier(.2,.8,.2,1)' : 'none',
            background: 'var(--pos-tab-active-bg)',
          }}
          aria-hidden="true"
        />

        {/* Notch mask to hide panel top border under active tab */}
        <span
          className="absolute -bottom-1 h-3 rounded-t-md pointer-events-none z-10"
          style={{
            left: indicator.left,
            width: indicator.width,
            transition: ready ? 'left 260ms cubic-bezier(.2,.8,.2,1), width 260ms cubic-bezier(.2,.8,.2,1)' : 'none',
            background: 'var(--pos-bg-sand)',
          }}
          aria-hidden="true"
        />

        {tabs.map((cat, i) => {
          const active = value === cat;
          return (
            <button
              key={cat}
              ref={el => (btnRefs.current[i] = el)}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onKeyDown={onKeyNav}
              onClick={() => onChange(cat)}
              className={`relative z-20 h-9 px-3 rounded-t-xl text-[12px] font-medium whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 transition-opacity hover:opacity-100 ${
                active
                  ? ''
                  : 'hover:bg-[var(--pos-tab-bg)] after:content-["\""] after:absolute after:left-2 after:right-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--pos-card-border)] after:transition-opacity after:opacity-0 hover:after:opacity-100'
              }`}
              style={
                active
                  ? { color: 'var(--pos-text-heading)' }
                  : { color: 'var(--pos-text-heading)', opacity: 0.85 }
              }
            >
              <span ref={el => (labelRefs.current[i] = el)} className="inline-block">
                {cat === 'all' ? 'Todas' : cat}
              </span>
            </button>
          );
        })}
      </div>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CategoryTabs;
