"use client";
import React from 'react';

interface ViewToggleProps {
  value: 'grid' | 'list';
  onChange: (v: 'grid' | 'list')=> void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ value, onChange }) => {
  return (
      <div className='inline-flex items-center rounded-lg overflow-hidden shadow-sm'
           style={{background:'var(--pos-card-bg)', border:'1px solid var(--pos-card-border)'}}>
      {(['grid','list'] as const).map(v => {
        const active = value === v;
        return (
          <button
            key={v}
            type='button'
            onClick={()=> onChange(v)}
              className={`px-3 py-1.5 text-[12px] font-medium flex items-center gap-1 transition-colors focus:outline-none ${active ? 'text-white' : ''}`}
              style={active ? {background:'var(--pos-accent-green)'} : {color:'var(--pos-text-muted)'}}
            aria-pressed={active}
          >
            {v === 'grid' ? (
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.3' className='w-4 h-4'><path d='M3 3h5v5H3V3Zm0 9h5v5H3v-5Zm9-9h5v5h-5V3Zm0 9h5v5h-5v-5Z' strokeLinecap='round' strokeLinejoin='round'/></svg>
            ) : (
              <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.3' className='w-4 h-4'><path d='M4 6h12M4 10h12M4 14h12' strokeLinecap='round'/></svg>
            )}
            <span className='capitalize hidden sm:inline'>{v}</span>
          </button>
        );
      })}
    </div>
  );
};
