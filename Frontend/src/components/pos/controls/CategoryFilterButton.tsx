"use client";
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  categories: string[];
  value: string; // selected category name or 'all'
  onChange: (cat: string) => void;
}

export const CategoryFilterButton: React.FC<Props> = ({ categories, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const list = ['all', ...categories];
  const label = value === 'all' ? 'Todas' : value;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current && !popRef.current.contains(t) && btnRef.current && !btnRef.current.contains(t)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick); };
  }, [open]);

  const select = (cat: string) => { onChange(cat); setOpen(false); };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o=>!o)}
        className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 focus:outline-none focus-visible:ring-2 transition bg-white border hover:bg-gray-50"
        style={{ borderColor: 'var(--pos-card-border)', color: 'var(--pos-text-heading)' }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate max-w-[6.5rem]">{label}</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div
          ref={popRef}
          className="absolute z-40 mt-1 min-w-[170px] max-h-[260px] overflow-y-auto rounded-lg border bg-white shadow-lg p-1 flex flex-col text-xs"
          role="listbox"
          style={{ borderColor: 'var(--pos-card-border)' }}
        >
          {list.map(cat => {
            const active = value === cat;
            return (
              <button
                key={cat}
                onClick={() => select(cat)}
                role="option"
                aria-selected={active}
                className={`text-left w-full px-2 py-1.5 rounded-md transition flex items-center gap-2 ${active ? 'bg-[var(--pos-accent-green)] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                {cat === 'all' ? 'Todas' : cat}
                {active && <svg viewBox="0 0 24 24" className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17l9-10"/></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryFilterButton;
