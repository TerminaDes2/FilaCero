"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PaymentTicketLine {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
  note?: string;
  sku?: string | null;
}

export interface PaymentTicketData {
  saleId?: string;
  folio?: string;
  orderId?: string;
  businessName?: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessId?: string;
  issuedAt?: string;
  cashierName?: string | null;
  customerName?: string | null;
  lines: PaymentTicketLine[];
  subtotal: number;
  discount?: number;
  total: number;
  methodLabel: string;
  methodCode?: Method | string;
  amountReceived?: number;
  change?: number;
  reference?: string;
  orderStatus?: string;
}

type Method = 'efectivo' | 'credito' | 'debito';

export const PaymentSuccessPanel: React.FC<{
  total: number;
  method?: Method;
  received?: number; // amount given by customer (for efectivo)
  onClose: () => void;
  onShare?: () => void;
  onPrint?: () => void;
  ticket?: PaymentTicketData | null;
}> = ({ total, method = 'efectivo', received, onClose, onShare, onPrint, ticket }) => {
  const amountReceived = received ?? total;
  const change = Math.max(0, amountReceived - total);
  const [mounted, setMounted] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const accent = 'var(--pos-accent-green)';
  const cardBg = 'var(--pos-bg-sand)';

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }), []);

  const formatMoney = (value: number) => currencyFormatter.format(value ?? 0);

  const formattedTicketDate = useMemo(() => {
    if (!ticket?.issuedAt) return null;
    try {
      return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(ticket.issuedAt));
    } catch {
      return ticket.issuedAt;
    }
  }, [ticket]);

  const handlePrint = () => {
    const node = ticketRef.current;
    if (!node) {
      onPrint?.();
      return;
    }

    onPrint?.();

    const printWindow = window.open('', '_blank', 'width=400,height=640');
    if (!printWindow) return;

    const printDocument = printWindow.document;
    printDocument.open();
    printDocument.write(`<!doctype html><html lang="es"><head><title>Ticket ${ticket?.folio ?? ticket?.saleId ?? ''}</title></head><body></body></html>`);
    printDocument.close();

    const { documentElement: sourceHtml } = document;
    if (printDocument.documentElement && sourceHtml) {
      printDocument.documentElement.className = sourceHtml.className;
    }

    const head = printDocument.head;
    if (head) {
      const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      styleNodes.forEach((styleNode) => {
        head.appendChild(styleNode.cloneNode(true));
      });

      const customStyles = printDocument.createElement('style');
      customStyles.textContent = `
        @page {
          size: 74mm auto;
          margin: 6mm;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          font-family: 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f8fafc;
          color: #0f172a;
        }
        .ticket-wrapper {
          width: 74mm;
          max-width: 74mm;
          padding: 14px 12px 18px;
        }
        .ticket-wrapper > * {
          width: 100%;
        }
      `;
      head.appendChild(customStyles);
    }

    const wrapper = printDocument.createElement('div');
    wrapper.className = 'ticket-wrapper';

    const clonedTicket = node.cloneNode(true) as HTMLElement;
    clonedTicket.style.width = '100%';
    wrapper.appendChild(clonedTicket);

    printDocument.body.appendChild(wrapper);

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 100);
  };

  const content = (
    <>
      {/* Overlay */}
      <button aria-label='Cerrar' onClick={onClose} className='fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[90]' />
      {/* Content wrapper */}
      <div className='fixed inset-0 z-[110] flex flex-col gap-6 md:flex-row md:items-stretch md:justify-end pointer-events-none overflow-y-auto md:overflow-hidden md:gap-0'>
        {ticket && (
          <section className='pointer-events-auto order-2 md:order-1 flex flex-col w-full max-w-[520px] px-5 pt-8 pb-10 md:w-[360px] lg:w-[380px] xl:w-[420px] md:max-w-none md:px-6 md:pr-0 md:pt-0 md:pb-0 md:self-stretch md:h-full overflow-y-auto'>
            <div
              ref={ticketRef}
              className='flex flex-col h-full border shadow-xl bg-white overflow-hidden print:shadow-none print:border-slate-200'
              style={{ borderColor: 'rgba(15, 23, 42, 0.08)' }}
            >
              <div className='px-6 py-5 text-center border-b' style={{ borderColor: 'rgba(148, 163, 184, 0.35)' }}>
                <p className='text-[11px] uppercase tracking-[0.42em] text-slate-400'>Ticket de venta</p>
                <h3 className='text-lg font-semibold text-slate-900 mt-2'>{ticket.businessName || 'Punto de venta'}</h3>
                {ticket.businessAddress && (
                  <p className='text-[11px] text-slate-500 mt-1'>{ticket.businessAddress}</p>
                )}
                {ticket.businessPhone && (
                  <p className='text-[11px] text-slate-500'>{ticket.businessPhone}</p>
                )}
              </div>

              <div className='px-6 py-4 text-[11px] text-slate-600 space-y-1 border-b' style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                <div className='flex items-center justify-between gap-4'><span className='uppercase tracking-[0.28em] text-[10px] text-slate-400'>Folio</span><span className='font-semibold text-slate-700'>{ticket.folio || ticket.saleId || '—'}</span></div>
                {ticket.orderId && (
                  <div className='flex items-center justify-between gap-4'><span className='uppercase tracking-[0.28em] text-[10px] text-slate-400'>Pedido</span><span className='font-medium text-slate-600'>{ticket.orderId}</span></div>
                )}
                {ticket.businessId && (
                  <div className='flex items-center justify-between gap-4'><span className='uppercase tracking-[0.28em] text-[10px] text-slate-400'>Sucursal</span><span className='font-medium text-slate-600'>{ticket.businessId}</span></div>
                )}
                <div className='flex items-center justify-between gap-4'><span className='uppercase tracking-[0.28em] text-[10px] text-slate-400'>Fecha</span><span className='font-medium text-slate-600'>{formattedTicketDate || '—'}</span></div>
                {ticket.cashierName && (
                  <div className='flex items-center justify-between gap-4'><span className='uppercase tracking-[0.28em] text-[10px] text-slate-400'>Cajero</span><span className='font-medium text-slate-600'>{ticket.cashierName}</span></div>
                )}
                {ticket.customerName && (
                  <div className='flex items-center justify-between gap-4'><span className='uppercase tracking-[0.28em] text-[10px] text-slate-400'>Cliente</span><span className='font-medium text-slate-600'>{ticket.customerName}</span></div>
                )}
                {ticket.orderStatus && (
                  <div className='flex items-center justify-between gap-4'><span className='uppercase tracking-[0.28em] text-[10px] text-slate-400'>Estado</span><span className='font-medium text-slate-600'>{ticket.orderStatus}</span></div>
                )}
                <div className='flex items-center justify-between gap-4'><span className='uppercase tracking-[0.28em] text-[10px] text-slate-400'>Pago</span><span className='font-medium text-slate-600'>{ticket.methodLabel}</span></div>
              </div>

              <div className='px-6 py-4 text-[12px] text-slate-700'>
                <div className='grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2'>
                  <span>Concepto</span>
                  <span className='text-right'>Cant</span>
                  <span className='text-right'>Importe</span>
                </div>
                <div className='space-y-3'>
                  {ticket.lines.length === 0 && (
                    <div className='text-[11px] text-slate-400 italic'>Sin detalles de productos</div>
                  )}
                  {ticket.lines.map((line, index) => (
                    <div key={`${line.name}-${index}`} className='grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1'>
                      <div className='text-[12px] font-medium text-slate-900'>{line.name}</div>
                      <div className='text-[12px] text-right text-slate-600 tabular-nums'>{line.qty}</div>
                      <div className='text-[12px] text-right text-slate-900 tabular-nums'>{formatMoney(line.total)}</div>
                      <div className='col-span-3 flex justify-between text-[10px] text-slate-400 uppercase tracking-[0.28em]'>
                        <span>{line.note ? `Nota: ${line.note}` : line.sku ? `SKU ${line.sku}` : '—'}</span>
                        <span>{formatMoney(line.unitPrice)} c/u</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='px-6 py-4 border-t space-y-2' style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                <div className='flex items-center justify-between text-[12px] text-slate-600'>
                  <span>Subtotal</span>
                  <span className='tabular-nums'>{formatMoney(ticket.subtotal)}</span>
                </div>
                {ticket.discount && ticket.discount > 0 && (
                  <div className='flex items-center justify-between text-[12px] text-slate-600'>
                    <span>Descuento</span>
                    <span className='tabular-nums'>- {formatMoney(ticket.discount)}</span>
                  </div>
                )}
                <div className='flex items-center justify-between text-[13px] font-semibold text-slate-900'>
                  <span>Total</span>
                  <span className='tabular-nums'>{formatMoney(ticket.total)}</span>
                </div>
                <div className='flex items-center justify-between text-[12px] text-slate-600'>
                  <span>Monto recibido</span>
                  <span className='tabular-nums'>{formatMoney(ticket.amountReceived ?? ticket.total)}</span>
                </div>
                <div className='flex items-center justify-between text-[12px] text-slate-600'>
                  <span>Cambio</span>
                  <span className='tabular-nums'>{formatMoney(ticket.change ?? Math.max(0, (ticket.amountReceived ?? ticket.total) - ticket.total))}</span>
                </div>
              </div>

              <footer className='px-6 py-5 text-center text-[11px] text-slate-400 border-t' style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
                <p>Gracias por confiar en nosotros.</p>
                <p>Conserva este ticket como comprobante.</p>
                {ticket.reference && <p className='mt-1'>Referencia: {ticket.reference}</p>}
              </footer>
            </div>

          </section>
        )}

        {/* Right side full-height panel */}
        <aside
          className='pointer-events-auto order-1 md:order-2 w-full md:w-[480px] lg:w-[520px] h-full md:h-full md:self-stretch shadow-2xl flex flex-col border-t md:border-t-0 md:border-l overflow-y-auto'
          style={{ background: 'var(--pos-card-bg)', borderColor: 'var(--pos-card-border)' }}
        >
        {/* Header aligned to PaymentPanel */}
        <div className='px-5 py-4 border-b flex items-center gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
          <h2 className='text-2xl font-extrabold tracking-tight flex-1' style={{ color: 'var(--pos-text-heading)' }}>Pago</h2>
          <button
            onClick={onClose}
            aria-label='Cerrar'
            className='w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2'
            style={{ background: 'var(--pos-accent-green)' }}
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
          <div className='rounded-2xl p-6 text-left mx-auto' style={{ background: cardBg, border: '1px solid var(--pos-border-soft)' }}>
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
                <span className='text-base font-extrabold' style={{ color: 'var(--pos-text-heading)' }}>Cambio del Cliente</span>
                <span className='text-base font-extrabold tabular-nums' style={{ color: 'var(--pos-text-heading)' }}>${change.toFixed(2)}</span>
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
                onClick={handlePrint}
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
      </div>
    </>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
};
