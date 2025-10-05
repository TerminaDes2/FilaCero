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
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [ready, setReady] = useState(false); // enable transitions only after first paint

  const updateIndicator = () => {
    const idx = Math.max(0, tabs.findIndex(t => t === value));
    const btn = btnRefs.current[idx];
    const container = containerRef.current;
    if (btn && container) {
      const bRect = btn.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      setIndicator({ left: bRect.left - cRect.left, width: bRect.width });
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
    // Recalculate on resize
    const handle = () => updateIndicator();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
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
        className="relative flex flex-wrap items-end gap-1.5 px-1.5 pt-1 overflow-visible"
        role="tablist"
        aria-label="Categorías de productos"
      >
        {/* Active tab slab (animated) */}
        <span
          className="absolute bottom-0 h-9 rounded-t-xl shadow-sm z-0"
          style={{
            left: 0,
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
            transition: ready ? 'transform 260ms cubic-bezier(.2,.8,.2,1), width 260ms cubic-bezier(.2,.8,.2,1)' : 'none',
            background: 'var(--pos-bg-sand)',

          }}
          aria-hidden="true"
        />

        {/* Notch mask to hide panel top border under active tab */}
        <span
          className="absolute -bottom-1 h-3 rounded-t-md pointer-events-none z-10"
          style={{
            left: 0,
            transform: `translateX(${indicator.left}px)`,
            width: indicator.width,
            transition: ready ? 'transform 260ms cubic-bezier(.2,.8,.2,1), width 260ms cubic-bezier(.2,.8,.2,1)' : 'none',
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
              className={`relative z-20 h-9 px-3 rounded-t-xl text-[12px] font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 transition-opacity hover:opacity-100 ${
                active
                  ? ''
                  : 'hover:bg-[var(--pos-badge-stock-bg)] after:content-[""] after:absolute after:left-2 after:right-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--pos-card-border)] after:transition-opacity after:opacity-0 hover:after:opacity-100'
              }`}
              style={
                active
                  ? { color: 'var(--pos-text-heading)' }
                  : { color: 'var(--pos-text-heading)', opacity: 0.85 }
              }
            >
              {cat === 'all' ? 'Todas' : cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;
