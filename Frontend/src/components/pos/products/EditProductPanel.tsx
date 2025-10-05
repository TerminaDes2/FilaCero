"use client";
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api';

export interface EditProductData {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string; // maps to id_categoria optional (string id)
  active: boolean; // maps to estado
}

interface EditProductPanelProps {
  initial: EditProductData;
  onClose: () => void;
  onSaved: () => void;
}

export const EditProductPanel: React.FC<EditProductPanelProps> = ({ initial, onClose, onSaved }) => {
  const [nombre, setNombre] = useState(initial.name);
  const [precio, setPrecio] = useState<number>(initial.price);
  const [sku, setSku] = useState(initial.sku || '');
  const [category, setCategory] = useState(initial.category || '');
  const [active, setActive] = useState<boolean>(initial.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => nameInputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleSave = async () => {
    setError(null);
    if (!nombre.trim() || precio <= 0) {
      setError('El nombre y el precio son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        nombre: nombre.trim(),
        precio: Number(precio),
        estado: active ? 'activo' : 'inactivo',
      };
      if (sku) payload.codigo_barras = sku;
      if (category) payload.id_categoria = category;
      await api.updateProduct(initial.id, payload);
      onSaved();
    } catch (err: any) {
      let msg = err?.message || 'No se pudo actualizar el producto.';
      if (err?.status === 401) msg = 'No autenticado. Inicia sesión.';
      if (err?.status === 403) msg = 'No tienes permisos (requiere rol admin).';
      if (err?.status === 400) msg = 'Datos inválidos (revisa categoría o precio).';
      setError(msg);
      console.error('Update product error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button aria-label='Cerrar editor' onClick={onClose} className='fixed inset-0 bg-black/35 backdrop-blur-[1px] cursor-default z-[90]' />
      <aside className='fixed right-0 top-0 h-screen w-[92vw] sm:w-[440px] md:w-[480px] shadow-2xl z-[110] flex flex-col' style={{ background: 'var(--pos-card-bg)', borderLeft: '1px solid var(--pos-card-border)' }}>
        <div className='px-5 py-4 border-b flex items-center gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
          <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>
            <svg viewBox='0 0 24 24' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
              <rect x='3' y='7' width='14' height='10' rx='2' />
              <path d='M7 7V5h14v10h-2' />
            </svg>
          </div>
          <div className='flex-1 min-w-0'>
            <div className='text-[11px] font-semibold uppercase tracking-wide' style={{ color: 'var(--pos-text-muted)' }}>Editar</div>
            <h2 className='text-xl font-extrabold truncate' style={{ color: 'var(--pos-text-heading)' }}>{nombre || 'Producto'}</h2>
          </div>
          <button onClick={onClose} className='w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2 transition-colors' style={{ background: 'var(--fc-brand-600)' }}>✕</button>
        </div>
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {error && (
            <div className='text-[12px] text-rose-700 bg-rose-50/80 border border-rose-200/70 rounded-md px-3 py-2'>{error}</div>
          )}
          <section className='rounded-2xl p-4 space-y-3' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-border-soft)' }}>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-extrabold' style={{ color: 'var(--pos-text-heading)' }}>Información básica</h3>
              <span className='px-2 py-0.5 rounded-md text-[11px] font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>{category || 'Categoría'}</span>
            </div>
            <div>
              <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Nombre</label>
              <input ref={nameInputRef} value={nombre} onChange={e => setNombre(e.target.value)} className='w-full h-10 rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>SKU</label>
                <input value={sku} onChange={e => setSku(e.target.value)} className='w-full h-10 rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
              </div>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Categoría</label>
                <div className='relative'>
                  <select value={category} onChange={e => setCategory(e.target.value)} className='appearance-none w-full h-10 rounded-lg pl-3 pr-8 text-sm focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}>
                    <option value=''>Sin categoría</option>
                    <option value='1'>Bebidas</option>
                    <option value='2'>Alimentos</option>
                    <option value='3'>Postres</option>
                  </select>
                  <svg aria-hidden viewBox='0 0 24 24' className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' style={{ color: 'var(--pos-text-muted)' }}>
                    <path d='M6 9l6 6 6-6' />
                  </svg>
                </div>
              </div>
            </div>
          </section>
          <section className='rounded-2xl p-4 space-y-3' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-border-soft)' }}>
            <h3 className='text-sm font-extrabold' style={{ color: 'var(--pos-text-heading)' }}>Precio y estado</h3>
            <div className='grid grid-cols-2 gap-3 items-end'>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Precio</label>
                <div className='relative'>
                  <span className='absolute left-2 top-1/2 -translate-y-1/2 text-sm px-1.5 py-0.5 rounded-md' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>$</span>
                  <input type='number' step='0.01' value={precio} onChange={e => setPrecio(parseFloat(e.target.value || '0'))} className='w-full h-10 rounded-lg pl-8 pr-3 text-sm tabular-nums focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                </div>
              </div>
              <div className='flex items-end justify-between'>
                <div className='flex flex-col'>
                  <span className='text-xs font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Estado</span>
                  <button type='button' onClick={() => setActive(v => !v)} className={`mt-2 h-8 px-3 rounded-full text-xs font-semibold transition-colors ${active ? 'text-white' : ''}`} style={active ? { background: 'var(--pos-accent-green)' } : { background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>
                    {active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className='p-5 border-t flex items-center justify-between gap-2' style={{ borderColor: 'var(--pos-card-border)' }}>
          <div className='text-[11px] text-[var(--pos-text-muted)] hidden sm:block'>Esc para cerrar</div>
          <div className='ml-auto flex items-center gap-2'>
            <button onClick={onClose} className='h-11 px-4 rounded-lg text-sm font-semibold transition-colors' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} disabled={saving}>Cancelar</button>
            <button onClick={handleSave} className='h-11 px-5 rounded-full text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60' style={{ background: 'var(--fc-brand-600)' }} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar →'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
