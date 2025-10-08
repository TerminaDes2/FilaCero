"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConfirm } from '../../system/ConfirmProvider';

type Method = 'efectivo' | 'credito' | 'debito';
type AccountType = 'normal' | 'dividida';

export interface PaymentPanelProps {
  totalDue: number;
  currency?: 'MXN' | 'USD';
  onClose: () => void;
  onConfirm?: (data: {
    method: Method;
    accountType: AccountType;
    amountReceived: number;
    change: number;
  }) => void;
}

const quickAmounts = [10, 20, 50, 100];

export const PaymentPanel: React.FC<PaymentPanelProps> = ({ totalDue, currency = 'MXN', onClose, onConfirm }) => {
  const confirmDialog = useConfirm();
  const [mounted, setMounted] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('normal');
  const [method, setMethod] = useState<Method>('efectivo');
  const [input, setInput] = useState<string>('');
  const [splitA, setSplitA] = useState<string>('');
  const [splitB, setSplitB] = useState<string>('');

  const amountReceived = useMemo(() => {
    const n = parseFloat(input.replace(/,/g, '.'));
    return Number.isFinite(n) ? n : 0;
  }, [input]);

  const change = Math.max(0, amountReceived - totalDue);

  const canPay = useMemo(() => {
    if (accountType === 'dividida') {
      const a = parseFloat(splitA.replace(/,/g, '.')) || 0;
      const b = parseFloat(splitB.replace(/,/g, '.')) || 0;
      return Math.abs(a + b - totalDue) < 0.005; // allow tiny float error
    }
    if (method === 'credito') return true; // se asume exacto
    return amountReceived >= totalDue;
  }, [accountType, splitA, splitB, amountReceived, totalDue, method]);

  useEffect(() => {
    // Al elegir tarjeta (crédito/débito), fijar recibido = total y bloquear input
    if (method === 'credito' || method === 'debito') {
      setInput(String(totalDue.toFixed(2)));
    } else if (amountReceived === totalDue) {
      // mantener si el usuario ya había puesto exacto
    }
  }, [method, totalDue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const append = (ch: string) => {
    if (method === 'credito') return; // bloqueado
    if (ch === '.' || ch === ',') {
      if (input.includes('.') || input.includes(',')) return;
      setInput(prev => (prev || '0') + '.');
      return;
    }
    setInput(prev => (prev === '0' ? ch : (prev + ch)));
  };
  const backspace = () => setInput(prev => prev.slice(0, -1));
  const clear = () => setInput('');
  const setQuick = (val: number) => setInput(val.toFixed(2));

  const confirm = async () => {
    if (!canPay) return;
    const ok = await confirmDialog({
      title: 'Confirmar pago',
      description: `Se cobrará ${currency} $${totalDue.toFixed(2)}${accountType==='dividida' ? ' (cuenta dividida)' : ''}. ¿Deseas continuar?`,
      confirmText: 'Pagar ahora',
      cancelText: 'Cancelar',
      tone: 'accent'
    });
    if (!ok) return;
    onConfirm?.({ method, accountType, amountReceived, change });
    onClose();
  };

  const content = (
    <>
      {/* Overlay */}
      <button aria-label='Cerrar pago' onClick={onClose} className='fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[90]' />
      {/* Panel lateral */}
      <aside className='fixed right-0 top-0 h-screen w-[92vw] sm:w-[440px] md:w-[480px] z-[110] shadow-2xl flex flex-col'
             style={{ background: 'var(--pos-card-bg)', borderLeft: '1px solid var(--pos-card-border)' }}>
        {/* Header */}
        <div className='px-5 py-4 border-b flex items-center gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
          <h2 className='text-2xl font-extrabold tracking-tight flex-1' style={{ color: 'var(--pos-text-heading)' }}>Pago</h2>
          <div className='rounded-full overflow-hidden flex shadow-sm' style={{ background: 'var(--pos-tab-bg)', border: '1px solid var(--pos-card-border)' }}>
            {([
              { key: 'normal', label: 'Cuenta normal' },
              { key: 'dividida', label: 'Cuenta dividida' }
            ] as const).map(t => (
              <button key={t.key} onClick={()=> setAccountType(t.key as AccountType)}
                      className={`px-4 py-1.5 text-xs font-semibold whitespace-nowrap ${accountType===t.key ? 'text-white' : ''}`}
                      style={accountType===t.key ? { background: 'var(--pos-accent-green)' } : { color: 'var(--pos-text-muted)' }}>
                {t.label}
              </button>
            ))}
          </div>
    <button onClick={onClose} className='ml-2 w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2'
      style={{ background: 'var(--pos-accent-green)' }}>
            <span aria-hidden>✕</span>
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {/* Métodos de pago */}
          <div className='grid grid-cols-3 gap-3'>
            {([
              { key: 'efectivo', label: 'Efectivo' },
              { key: 'credito', label: 'Crédito' },
              { key: 'debito', label: 'Débito' }
            ] as const).map(m => {
              const active = method === m.key;
              const selectedBorder = m.key === 'efectivo' && active ? 'var(--pos-cash-border)' : (active ? 'var(--pos-accent-green)' : 'var(--pos-card-border)');
              const textColor = m.key === 'efectivo' && active ? 'var(--pos-cash-text)' : 'var(--pos-text-heading)';
              return (
                <button key={m.key}
                        onClick={()=> setMethod(m.key)}
                        className='h-16 rounded-xl font-semibold text-sm'
                        style={{ background: 'var(--pos-card-bg)', border: `2px solid ${selectedBorder}`, color: textColor }}>
                  <span className='inline-flex items-center justify-center gap-2'>
                    {/* Iconos */}
                    {m.key === 'efectivo' && (
                      <svg viewBox='0 0 24 24' className='w-6 h-6' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' style={{ color: textColor }}>
                        <rect x='3' y='6' width='18' height='12' rx='2' />
                        <circle cx='12' cy='12' r='2.5' />
                      </svg>
                    )}
                    {m.key === 'credito' && (
                      <svg viewBox='0 0 24 24' className='w-6 h-6' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                        <rect x='3' y='5' width='18' height='14' rx='2' />
                        <path d='M3 10h18' />
                        <rect x='7' y='13' width='5' height='2' rx='1' />
                      </svg>
                    )}
                    {m.key === 'debito' && (
                      <svg viewBox='0 0 24 24' className='w-6 h-6' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                        <rect x='3' y='5' width='18' height='14' rx='2' />
                        <path d='M3 10h18' />
                        <rect x='15' y='13' width='4' height='2' rx='1' />
                      </svg>
                    )}
                    <span>{m.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Área de cálculo */}
          <div className='rounded-xl p-4 space-y-3' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-border-soft)' }}>
            <div className='grid grid-cols-2 gap-6 items-end'>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Ingresa cantidad</label>
                <div className='relative'>
                  <span className='absolute left-2 top-1/2 -translate-y-1/2 text-sm px-1.5 py-0.5 rounded-md' style={{ background: 'var(--pos-badge-stock-bg)', color: 'var(--pos-chip-text)' }}>$</span>
                  <input
                    inputMode='decimal'
                    disabled={method!=='efectivo'}
                    value={input}
                    onChange={e=> setInput(e.target.value)}
                    placeholder='0.00'
                    className='w-full h-11 rounded-lg pl-9 pr-3 text-base focus:outline-none focus-visible:ring-2'
                    style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}
                  />
                </div>
              </div>
              <div>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Cambio del Cliente</span>
                  {amountReceived === totalDue && method!=='credito' && (
                    <span className='text-[10px] px-1.5 py-0.5 rounded-full' style={{ background: 'var(--pos-badge-stock-bg)', color: 'var(--pos-chip-text)' }}>Exacto</span>
                  )}
                </div>
                <div className='mt-1 text-lg font-semibold tabular-nums' style={{ color: 'var(--pos-text-heading)' }}>
                  {method==='efectivo'
                    ? (change > 0 ? `$${change.toFixed(2)}` : (amountReceived < totalDue ? `Falta $${(totalDue-amountReceived).toFixed(2)}` : `$0.00`))
                    : `$0.00`}
                </div>
              </div>
            </div>
            {method==='efectivo' && (
              <div className='flex flex-wrap gap-2'>
                <button onClick={()=> setInput(totalDue.toFixed(2))} className='h-8 px-3 rounded-full text-xs font-semibold' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>Dinero exacto</button>
                {quickAmounts.map(q => (
                  <button key={q} onClick={()=> setQuick(q)} className='h-8 px-3 rounded-full text-xs font-medium' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>
                    ${q}
                  </button>
                ))}
                <button onClick={clear} className='h-8 px-3 rounded-full text-xs' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-muted)' }}>Limpiar</button>
              </div>
            )}
            {accountType==='dividida' && (
              <div className='pt-2 border-t' style={{ borderColor: 'var(--pos-card-border)' }}>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs mb-1' style={{ color: 'var(--pos-text-muted)' }}>Parte A</label>
                    <input value={splitA} onChange={e=> setSplitA(e.target.value)} placeholder='0.00' className='w-full h-9 rounded-md px-2 text-sm' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                  </div>
                  <div>
                    <label className='block text-xs mb-1' style={{ color: 'var(--pos-text-muted)' }}>Parte B</label>
                    <input value={splitB} onChange={e=> setSplitB(e.target.value)} placeholder='0.00' className='w-full h-9 rounded-md px-2 text-sm' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                  </div>
                </div>
                <div className='mt-2 text-xs' style={{ color: 'var(--pos-text-muted)' }}>Suma: ${( (parseFloat(splitA)||0) + (parseFloat(splitB)||0) ).toFixed(2)} / ${totalDue.toFixed(2)}</div>
              </div>
            )}
          </div>

          {/* Teclado numérico */}
          {method==='efectivo' && (
            <div className='rounded-2xl overflow-hidden'>
              <div className='grid grid-cols-3 gap-2'>
                {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map((key) => {
                  const isDel = key==='⌫';
                  return (
                    <button key={key}
                            onClick={() => isDel ? backspace() : append(key)}
                            className='h-16 text-base font-semibold'
                            style={{
                              background: isDel ? 'var(--pos-danger-bg)' : 'var(--pos-badge-stock-bg)',
                              color: isDel ? '#fff' : 'var(--pos-text-heading)'
                            }}>
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className='p-5 border-t flex items-center justify-end gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
          <button onClick={onClose} className='h-11 px-4 rounded-lg text-sm font-semibold text-white' style={{ background: 'var(--pos-accent-green)' }}>Cancelar</button>
          <button onClick={confirm} disabled={!canPay} className='h-11 px-5 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed text-white' style={{ background: 'var(--pos-accent-green)' }}>Pagar ahora →</button>
        </div>
      </aside>
    </>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};

export default PaymentPanel;
