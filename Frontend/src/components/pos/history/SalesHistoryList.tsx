"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { SearchBox } from '../controls/SearchBox';
import { useTranslation } from '../../../hooks/useTranslation';
import { TopRightInfo } from '../header/TopRightInfo';

interface SaleItem {
  id_venta: string | number;
  fecha_venta: string | null;
  estado: string;
  total: number | string | null;
  usuarios?: { nombre?: string | null } | null;
  tipo_pago?: { tipo?: string | null } | null;
  detalle_venta?: Array<{
    cantidad: number;
    precio_unitario: number | string;
    producto?: { nombre?: string | null } | null;
  }>;
}

export const SalesHistoryList: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [sales, setSales] = useState<SaleItem[]>([]);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError(null);
    api.getSales({ estado: status || undefined, desde: from || undefined, hasta: to || undefined })
      .then((data) => { if (!aborted) setSales(data || []); })
      .catch((err) => { if (!aborted) setError(err?.message || t('pos.history.error')); })
      .finally(() => { if (!aborted) setLoading(false); });
    return () => { aborted = true; };
  }, [status, from, to]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sales;
    return sales.filter(s => {
      const id = String(s.id_venta ?? '').toLowerCase();
      const user = String(s.usuarios?.nombre ?? '').toLowerCase();
      const pay = String(s.tipo_pago?.tipo ?? '').toLowerCase();
      const anyItem = (s.detalle_venta || []).some(d => String(d.producto?.nombre ?? '').toLowerCase().includes(term));
      return id.includes(term) || user.includes(term) || pay.includes(term) || anyItem;
    });
  }, [sales, search]);

  return (
    <section className='flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-8 pb-3 -mt-4 flex flex-col' style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 0 0 1px var(--pos-border-soft)' }}>
      <header className='space-y-3 mb-3 flex-none'>
        <div className='flex flex-col md:flex-row md:items-center gap-3'>
          <div className='flex-1 min-w-0'>
            <SearchBox value={search} onChange={setSearch} />
          </div>
          <div className='flex items-center flex-wrap gap-2'>
            <select value={status} onChange={e=> setStatus(e.target.value)} className='h-9 px-3 rounded-lg text-sm' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color:'var(--pos-text-heading)' }}>
              <option value=''>{t('pos.history.filters.status.all')}</option>
              <option value='pagada'>{t('pos.history.filters.status.paid')}</option>
              <option value='abierta'>{t('pos.history.filters.status.open')}</option>
              <option value='cancelada'>{t('pos.history.filters.status.cancelled')}</option>
            </select>
            <input type='date' value={from} onChange={e=> setFrom(e.target.value)} className='h-9 px-3 rounded-lg text-sm' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color:'var(--pos-text-heading)' }} />
            <span className='text-sm' style={{ color: 'var(--pos-text-muted)' }}>→</span>
            <input type='date' value={to} onChange={e=> setTo(e.target.value)} className='h-9 px-3 rounded-lg text-sm' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color:'var(--pos-text-heading)' }} />
          </div>
        </div>
      </header>

      <div className='flex-1 min-h-0 overflow-y-auto pr-1 pb-4 custom-scroll-area'>
        {loading && <div className='text-center py-10 text-[var(--pos-text-muted)] text-sm'>{t('pos.history.loading')}</div>}
        {error && !loading && <div className='text-center py-24 text-red-500'>{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className='text-center py-16 px-4'>
            <svg viewBox='0 0 24 24' className='w-12 h-12 mx-auto text-slate-300' fill='none' stroke='currentColor' strokeWidth='1.4'>
              <circle cx='12' cy='12' r='7' />
              <path d='M8 12h8' />
            </svg>
            <p className='text-sm font-medium text-slate-600 mt-3'>{t('pos.history.empty.title')}</p>
            <p className='text-[12px] text-slate-500 mt-1'>{t('pos.history.empty.subtitle')}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <ul className='space-y-2'>
            {filtered.map((s) => {
              const id = String(s.id_venta);
              const date = s.fecha_venta ? new Date(s.fecha_venta) : null;
              // Calcular total de forma robusta: usar s.total si viene; si no, sumar detalle_venta
              let total = typeof s.total === 'number' ? s.total : parseFloat(String(s.total ?? '0'));
              const itemsForTotal = s.detalle_venta || [];
              if (!Number.isFinite(total) || total === 0) {
                total = itemsForTotal.reduce((acc, d) => acc + (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0), 0);
              }
              const estado = s.estado;
              const items = s.detalle_venta || [];
              return (
                <li key={id} className='rounded-xl p-3 shadow-sm' style={{ background:'var(--pos-card-bg)', border:'1px solid var(--pos-card-border)' }}>
                  <div className='flex items-start gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='text-[11px] px-1.5 py-0.5 rounded-full' style={{ background:'var(--pos-badge-stock-bg)', color:'var(--pos-chip-text)' }}>{t('pos.history.saleId', { id })}</span>
                        <span className='text-[10px] px-1.5 py-0.5 rounded-full' style={{ background:'var(--pos-badge-stock-bg)', color:'var(--pos-chip-text)' }}>{estado}</span>
                      </div>
                      <p className='text-sm font-semibold mt-1' style={{ color:'var(--pos-text-heading)' }}>{date ? date.toLocaleString() : t('pos.history.noDate')}</p>
                      <p className='text-[12px] mt-0.5' style={{ color:'var(--pos-text-muted)' }}>{s.usuarios?.nombre || t('pos.history.noCustomer')} · {s.tipo_pago?.tipo || t('pos.history.noPaymentType')}</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-[13px] font-semibold tabular-nums' style={{ color:'var(--pos-text-heading)' }}>${Number.isFinite(total) ? total.toFixed(2) : '0.00'}</p>
                    </div>
                  </div>
                  {items.length > 0 && (
                    <div className='mt-2 pt-2 border-t' style={{ borderColor: 'var(--pos-card-border)' }}>
                      <ul className='text-[12px] space-y-1' style={{ color:'var(--pos-text-muted)' }}>
                        {items.map((d, idx) => (
                          <li key={idx} className='flex justify-between'>
                            <span className='truncate'>{d.cantidad}× {d.producto?.nombre || t('pos.history.itemFallback')}</span>
                            <span className='tabular-nums'>${(typeof d.precio_unitario === 'number' ? d.precio_unitario : parseFloat(String(d.precio_unitario || 0))).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
