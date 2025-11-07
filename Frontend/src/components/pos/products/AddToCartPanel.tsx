"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { POSProduct, useCart } from '../../../pos/cartContext';

export interface AddToCartPanelProps {
  product: POSProduct;
  onClose: () => void;
  // Optional edit mode: when provided, prefill qty/note and call onSave instead of add
  lineId?: string;
  initialQty?: number;
  initialNote?: string;
}

export const AddToCartPanel: React.FC<AddToCartPanelProps> = ({ product, onClose, lineId, initialQty, initialNote }) => {
  const { add, updateLine } = useCart();
  const [mounted, setMounted] = useState(false);
  const [qtyStr, setQtyStr] = useState(String(initialQty ?? 1));
  const [note, setNote] = useState(initialNote ?? '');
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const qty = useMemo(() => {
    const n = parseInt(qtyStr, 10);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return Math.min(n, product.stock > 0 ? product.stock : 1);
  }, [qtyStr, product.stock]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Autofocus quantity field when panel mounts
    if (mounted) qtyInputRef.current?.focus();
  }, [mounted]);

  const handleAdd = useCallback(() => {
    if (qty <= 0) return;
    if (lineId) {
      updateLine(lineId, qty, note);
    } else {
      add(product, qty, note);
    }
    onClose();
  }, [qty, lineId, updateLine, note, add, product, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAdd, onClose]);

  const accent = 'var(--pos-accent-green)';
  const candy = 'var(--pos-badge-stock-bg)';

  const notePresets = ['Sin cebolla', 'Bien cocido', 'Poco picante', 'Para llevar'];

  const content = (
    <>
      {/* Overlay */}
      <button aria-label='Cerrar' onClick={onClose} className='fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[90]' />

      {/* Right-side panel */}
      <aside className='fixed right-0 top-0 h-screen w-[92vw] sm:w-[420px] md:w-[460px] z-[110] shadow-2xl flex flex-col'
             style={{ background: 'var(--pos-card-bg)', borderLeft: '1px solid var(--pos-card-border)' }}>
        {/* Header */}
        <div className='px-5 py-4 border-b flex items-center gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
          <h2 className='text-xl font-extrabold tracking-tight flex-1' style={{ color: 'var(--pos-text-heading)' }}>{lineId ? 'Editar artículo' : 'Añadir al carrito'}</h2>
          <button onClick={onClose} className='w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2'
                  style={{ background: accent }}>✕</button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {/* Product snapshot */}
          <div className='rounded-2xl p-4 flex items-start gap-3' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-border-soft)' }}>
            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between gap-2'>
                <h3 className='text-lg font-extrabold leading-tight' style={{ color: 'var(--pos-text-heading)' }}>{product.name}</h3>
                <span className='px-2 py-0.5 rounded-md text-xs font-medium' style={{ background: candy, color: 'var(--pos-chip-text)' }}>{product.category || 'General'}</span>
              </div>
              {product.description && (
                <p className='mt-1 text-[12px] line-clamp-2' style={{ color: 'var(--pos-text-muted)' }}>{product.description}</p>
              )}
              <div className='mt-2 text-sm font-semibold' style={{ color: 'var(--pos-text-heading)' }}>${product.price.toFixed(2)}</div>
            </div>
          </div>

          {/* Inputs */}
          <div className='grid grid-cols-3 gap-3 items-end'>
            <div className='col-span-1'>
              <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Cantidad</label>
              <input
                ref={qtyInputRef}
                inputMode='numeric'
                value={qtyStr}
                onChange={e=> setQtyStr(e.target.value.replace(/[^0-9]/g, ''))}
                className='w-full h-11 rounded-lg px-3 text-base text-center tabular-nums focus:outline-none focus-visible:ring-2'
                style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}
                aria-label='Cantidad'
              />
              <div className='mt-1 text-[11px]' style={{ color: 'var(--pos-text-muted)' }}>Stock: {product.stock}</div>
            </div>
            <div className='col-span-2'>
              <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Notas</label>
              <textarea
                value={note}
                onChange={e=> setNote(e.target.value)}
                placeholder='Instrucciones especiales (sin cebolla, bien cocido, etc.)'
                className='w-full h-24 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus-visible:ring-2'
                style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}
              />
              <div className='mt-2 flex flex-wrap gap-2'>
                {notePresets.map(p => (
                  <button key={p} type='button' onClick={()=> setNote(prev => prev ? `${prev}; ${p}` : p)} className='h-7 px-2 rounded-full text-[11px] font-medium'
                          style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>{p}</button>
                ))}
              </div>
              <div className='mt-1 text-[11px]' style={{ color: 'var(--pos-text-muted)' }}>Enter para {lineId ? 'guardar' : 'añadir'} rápidamente</div>
            </div>
          </div>

          {/* Fun accent mini-keypad for qty */}
          <div className='grid grid-cols-4 gap-2'>
            {['1','2','3','4','5','6','7','8','9','10','12','15'].map(k => (
              <button key={k} onClick={()=> setQtyStr(k)}
                      className='h-10 rounded-lg text-sm font-semibold'
                      style={{ background: 'var(--pos-badge-stock-bg)', color: 'var(--pos-text-heading)' }}>{k}×</button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className='p-5 border-t flex items-center justify-between gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
          <button onClick={onClose} className='h-11 px-4 rounded-lg text-sm font-semibold' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>Salir</button>
    <button onClick={handleAdd} className='h-11 px-5 rounded-full text-sm font-semibold text-white'
      style={{ background: 'var(--pos-accent-green)' }}>{lineId ? 'Guardar cambios ↵' : 'Añadir al carrito ↵'}</button>
        </div>
      </aside>
    </>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default AddToCartPanel;
