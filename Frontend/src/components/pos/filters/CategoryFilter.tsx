"use client";
import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  value: string;
  onChange: (cat: string)=> void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, value, onChange }) => {
  return (
    <div className='flex flex-wrap gap-2'>
      {['all', ...categories].map(cat => {
        const active = value === cat;
        return (
          <button
            key={cat}
            type='button'
            onClick={()=> onChange(cat)}
            className={`relative px-3 h-8 rounded-full text-[12px] font-medium transition-colors focus:outline-none select-none ${active ? 'text-white' : ''}`}
            style={active ? {background:'var(--pos-accent-green)'} : {background:'var(--pos-badge-stock-bg)', color:'var(--pos-text-muted)'}}
            aria-pressed={active}
          >
            {cat === 'all' ? 'Todas' : cat}
            {active && <span className='absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none' />}
          </button>
        );
      })}
    </div>
  );
};
