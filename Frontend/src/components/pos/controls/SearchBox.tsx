"use client";
import React, { useEffect, useRef } from 'react';
import { useShortcuts } from '../../system/ShortcutProvider';

interface SearchBoxProps {
  value: string;
  onChange: (v:string)=> void;
  onClear?: ()=> void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange, onClear }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { registerSearchInput } = useShortcuts({ optional: true });

  useEffect(() => {
    registerSearchInput(inputRef.current);
    return () => registerSearchInput(null);
  }, [registerSearchInput]);
  return (
    <div className='relative w-full max-w-sm'>
      <input
        ref={inputRef}
        value={value}
        onChange={e=> onChange(e.target.value)}
        placeholder='Buscar productos...'
        className='w-full h-10 pl-9 pr-9 rounded-xl text-sm placeholder-[var(--pos-text-muted)] focus:outline-none focus:ring-2 transition'
        style={{
          background:'var(--pos-card-bg)',
          border:'1px solid var(--pos-card-border)',
          color:'var(--pos-text-heading)'
        }}
      />
      <span className='absolute left-3 top-1/2 -translate-y-1/2' style={{color:'var(--pos-text-muted)'}}>
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.6' className='w-4 h-4'><circle cx='9' cy='9' r='6'/><path d='m14.5 14.5 3 3' strokeLinecap='round'/></svg>
      </span>
      {value && (
        <button type='button' onClick={()=> { onChange(''); onClear?.(); }} className='absolute right-2 top-1/2 -translate-y-1/2 focus:outline-none' style={{color:'var(--pos-text-muted)'}}>
          <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.6' className='w-4 h-4'><path d='m6 6 8 8M6 14 14 6' strokeLinecap='round' strokeLinejoin='round'/></svg>
          <span className='sr-only'>Limpiar</span>
        </button>
      )}
    </div>
  );
};
