"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Method = 'efectivo' | 'credito' | 'debito';

export const PaymentSuccessPanel: React.FC<{
  total: number;
  method?: Method;
  received?: number; // amount given by customer (for efectivo)
  onClose: () => void;
  onShare?: () => void;
  onPrint?: () => void;
}> = ({ total, method = 'efectivo', received, onClose, onShare, onPrint }) => {
  const amountReceived = received ?? total;
  const change = Math.max(0, amountReceived - total);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const accent = '#d66b85'; // success brand accent (rose)
  const cardBg = '#f7e6b7'; // warm yellow for summary card

  const content = (
    <>
      {/* Overlay */}
      <button aria-label='Cerrar' onClick={onClose} className='fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[90]' />
      {/* Right side full-height panel */}
      <aside className='fixed right-0 top-0 h-screen w-[92vw] sm:w-[440px] md:w-[480px] z-[110] shadow-2xl flex flex-col'
             style={{ background: 'var(--pos-card-bg)', borderLeft: '1px solid var(--pos-card-border)' }}>
        {/* Header aligned to PaymentPanel */}
        <div className='px-5 py-4 border-b flex items-center gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
          <h2 className='text-2xl font-extrabold tracking-tight flex-1' style={{ color: 'var(--pos-text-heading)' }}>Pago</h2>
          <button
            onClick={onClose}
            aria-label='Cerrar'
            className='w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2'
            style={{ background: 'var(--fc-brand-600)' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {/* Icon */}
          <div className='mx-auto w-24 h-24 rounded-2xl flex items-center justify-center mb-6' style={{ background: accent }}>
            <svg viewBox='0 0 24 24' className='w-12 h-12' fill='none' stroke='white' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M20 6L9 17l-5-5' />
            </svg>
          </div>

          {/* Title and subtitle */}
          <h2 className='text-3xl font-extrabold tracking-tight -mt-2 text-center' style={{ color: 'var(--pos-text-heading)' }}>¡Pago Exitoso!</h2>
          <p className='text-sm text-center' style={{ color: 'var(--pos-text-muted)' }}>
            Pagaste con éxito la cuenta. ¡Bien hecho!
          </p>

          {/* Summary card */}
          <div className='rounded-2xl p-6 text-left mx-auto' style={{ background: cardBg }}>
            <div className='text-center mb-4'>
              <p className='text-sm font-semibold' style={{ color: 'var(--pos-text-muted)' }}>Monto total</p>
              <p className='text-3xl font-extrabold tabular-nums' style={{ color: accent }}>${total.toFixed(2)}</p>
            </div>

            <div className='space-y-3 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-[13px]' style={{ color: 'var(--pos-text-muted)' }}>Método de pago</span>
                <span className='text-[13px]' style={{ color: '#1f1b16' }}>
                  {method === 'efectivo' ? 'Efectivo' : method === 'credito' ? 'Crédito' : 'Débito'}
                </span>
              </div>
              {method === 'efectivo' && (
                <div className='flex items-center justify-between'>
                  <span className='text-[13px]' style={{ color: 'var(--pos-text-muted)' }}>Efectivo</span>
                  <span className='text-[13px] tabular-nums' style={{ color: '#1f1b16' }}>${amountReceived.toFixed(2)}</span>
                </div>
              )}

              <div className='border-t border-dotted mt-3' style={{ borderColor: 'rgba(0,0,0,0.35)' }} />

              <div className='flex items-center justify-between pt-2'>
                <span className='text-base font-extrabold' style={{ color: '#1f1b16' }}>Cambio del Cliente</span>
                <span className='text-base font-extrabold tabular-nums' style={{ color: '#1f1b16' }}>${change.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions aligned to PaymentPanel spacing */}
        <div className='p-5 border-t mt-auto' style={{ borderColor: 'var(--pos-card-border)' }}>
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <button onClick={onClose} className='text-base font-semibold px-1 py-2 focus:outline-none' style={{ color: '#1f1b16' }}>
              Cerrar
            </button>
            <div className='flex items-center gap-3'>
              <button
                onClick={onShare}
                className='h-11 px-4 rounded-xl text-sm font-semibold'
                style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}
              >
                Compartir recibo ▾
              </button>
              <button
                onClick={onPrint}
                className='h-11 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2'
                style={{ background: accent }}
              >
                <svg viewBox='0 0 24 24' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M6 9V3h12v6' />
                  <path d='M6 18h12v3H6z' />
                  <rect x='4' y='9' width='16' height='7' rx='2' />
                </svg>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};
