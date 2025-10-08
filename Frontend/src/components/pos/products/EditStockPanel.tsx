"use client";
import React, { useEffect, useRef, useState } from 'react';
import { api, activeBusiness } from '../../../lib/api';

interface EditStockPanelProps {
  product: { id: string; name: string; sku?: string };
  inventory?: { id?: string | null; cantidad_actual?: number | null; stock_minimo?: number | null };
  onClose: () => void;
  onSaved: () => void;
}

export const EditStockPanel: React.FC<EditStockPanelProps> = ({ product, inventory, onClose, onSaved }) => {
  const negocioId = activeBusiness.get() || process.env.NEXT_PUBLIC_NEGOCIO_ID || '';
  const [loadedInventory, setLoadedInventory] = useState<typeof inventory | null>(inventory ?? null);
  const [cantidad, setCantidad] = useState<number>(inventory?.cantidad_actual ?? 0);
  const [minimo, setMinimo] = useState<number>(inventory?.stock_minimo ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qtyRef = useRef<HTMLInputElement | null>(null);
  const [negocioManual, setNegocioManual] = useState<string>('');

  useEffect(() => {
    const t = setTimeout(() => qtyRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        !e.altKey &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        if (!saving) handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [onClose, saving]);

  useEffect(() => {
    // Si no pasaron inventory y no hay negocioId, intentamos traer inventario por producto (puede existir único registro)
    const maybeLoad = async () => {
      if (!inventory && !negocioId) {
        try {
          const list = await api.getInventory({ id_producto: String(product.id) });
          const inv = Array.isArray(list) && list.length > 0 ? list[0] : undefined;
          if (inv) {
            setLoadedInventory({ id: String(inv.id_inventario), cantidad_actual: Number(inv.cantidad_actual), stock_minimo: Number(inv.stock_minimo || 0) });
            setCantidad(Number(inv.cantidad_actual || 0));
            setMinimo(Number(inv.stock_minimo || 0));
          }
        } catch (e) {
          console.warn('No se pudo cargar inventario por producto:', e);
        }
      }
    };
    maybeLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const targetNegocioId = (negocioId || negocioManual).trim();
  const canCreate = !!targetNegocioId && !((loadedInventory ?? inventory)?.id);
  const canUpdate = !!((loadedInventory ?? inventory)?.id);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      if (canUpdate) {
        const invId = String((loadedInventory ?? inventory)!.id);
        await api.updateInventory(invId, {
          cantidad_actual: Number(cantidad),
          stock_minimo: Number(minimo),
        });
      } else if (canCreate) {
        await api.createInventory({
          id_negocio: String(targetNegocioId),
          id_producto: String(product.id),
          cantidad_actual: Number(cantidad),
          stock_minimo: Number(minimo) || 0,
        });
      } else {
        setError('Falta especificar un negocio para crear inventario. Define NEXT_PUBLIC_NEGOCIO_ID o ingresa un ID de negocio abajo.');
        setSaving(false);
        return;
      }
      onSaved();
    } catch (e: any) {
      let msg = e?.message || 'No se pudo guardar el inventario.';
      if (e?.status === 401) msg = 'No autenticado.';
      if (e?.status === 403) msg = 'Sin permisos (admin requerido).';
      if (e?.status === 400) msg = 'Datos inválidos o claves foráneas inexistentes.';
      setError(msg);
      console.error('Save inventory error:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button aria-label='Cerrar editor de stock' onClick={onClose} className='fixed inset-0 bg-black/35 backdrop-blur-[1px] cursor-default z-[90]' />
      <aside className='fixed right-0 top-0 h-screen w-[92vw] sm:w-[420px] md:w-[460px] shadow-2xl z-[110] flex flex-col' style={{ background: 'var(--pos-card-bg)', borderLeft: '1px solid var(--pos-card-border)' }}>
        <div className='px-5 py-4 border-b flex items-center gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
          <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ background: 'var(--pos-badge-stock-bg)', color: 'var(--pos-chip-text)' }}>📦</div>
          <div className='flex-1 min-w-0'>
            <div className='text-[11px] font-semibold uppercase tracking-wide' style={{ color: 'var(--pos-text-muted)' }}>Inventario</div>
            <h2 className='text-xl font-extrabold truncate' style={{ color: 'var(--pos-text-heading)' }}>{product.name}</h2>
          </div>
          <button onClick={onClose} className='w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2 transition-colors' style={{ background: 'var(--pos-accent-green)' }}>✕</button>
        </div>
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {error && <div className='text-[12px] text-rose-700 bg-rose-50/80 border border-rose-200/70 rounded-md px-3 py-2'>{error}</div>}
          {!negocioId && !((loadedInventory ?? inventory)?.id) && (
            <div className='space-y-2'>
              <div className='text-[12px] text-amber-800 bg-amber-50/90 border border-amber-200/70 rounded-md px-3 py-2'>
                No hay NEXT_PUBLIC_NEGOCIO_ID configurada. Puedes indicar aquí el ID de negocio para crear el inventario.
              </div>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>ID de negocio</label>
                <input value={negocioManual} onChange={e => setNegocioManual(e.target.value)} placeholder='p.ej. 1' className='w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' style={{ height: 'var(--pos-control-h)', borderRadius: 'var(--pos-control-radius)', background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
              </div>
            </div>
          )}
          <section className='rounded-2xl p-4 space-y-3' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-border-soft)' }}>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Cantidad actual</label>
                <input ref={qtyRef} type='number' value={cantidad} onChange={e => setCantidad(parseInt(e.target.value || '0', 10))} className='w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' style={{ height: 'var(--pos-control-h)', borderRadius: 'var(--pos-control-radius)', background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
              </div>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Stock mínimo</label>
                <input type='number' value={minimo} onChange={e => setMinimo(parseInt(e.target.value || '0', 10))} className='w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' style={{ height: 'var(--pos-control-h)', borderRadius: 'var(--pos-control-radius)', background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
              </div>
            </div>
          </section>
        </div>
        <div className='p-5 border-t flex items-center justify-between gap-2' style={{ borderColor: 'var(--pos-card-border)' }}>
          <div className='text-[11px] text-[var(--pos-text-muted)] hidden sm:block'>Esc para cerrar</div>
          <div className='ml-auto flex items-center gap-2'>
            <button onClick={onClose} className='px-4 rounded-lg text-sm font-semibold transition-colors' style={{ height: 'var(--pos-control-h)', borderRadius: 'var(--pos-control-radius)', background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} disabled={saving}>Cancelar</button>
            <button onClick={handleSave} className='px-5 rounded-full text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60' style={{ height: 'var(--pos-control-h)', background: 'var(--pos-accent-green)' }} disabled={saving}>
              {saving ? 'Guardando…' : canUpdate ? 'Actualizar →' : 'Crear inventario →'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
