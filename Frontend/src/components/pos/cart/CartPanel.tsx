"use client";
import React, { useMemo, useState } from 'react';
import { useCart } from '../../../pos/cartContext';
import { PaymentSuccessPanel, PaymentTicketData } from '../payments/PaymentSuccessPanel';
import { PaymentPanel } from '../payments/PaymentPanel';
import { AddToCartPanel } from '../products/AddToCartPanel';

import { useConfirm } from '../../system/ConfirmProvider';
import { api, activeBusiness } from '../../../lib/api';
import { useBusinessStore } from '../../../state/businessStore';
import { useUserStore } from '../../../state/userStore';

type TicketLine = {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
  note?: string;
  sku?: string;
};
export const CartPanel: React.FC = () => {
  const { items, subtotal, total, discount, remove, inc, dec, clear } = useCart();
  const confirm = useConfirm();
  const hasItems = items.length > 0;
  const [showPayment, setShowPayment] = useState(false); // show PaymentPanel
  const [showSuccess, setShowSuccess] = useState(false); // show PaymentSuccessPanel
  const [successData, setSuccessData] = useState<{ method: 'efectivo'|'credito'|'debito'; amountReceived: number; change: number }|null>(null);
  const [paidTotal, setPaidTotal] = useState<number|null>(null);
  const [editLineId, setEditLineId] = useState<string|null>(null);
  const [loading] = useState(false);
  const [saleTicket, setSaleTicket] = useState<PaymentTicketData | null>(null);
  const { activeBusiness: business } = useBusinessStore();
  const { user } = useUserStore();

  const methodLabels = useMemo(() => ({
    efectivo: 'Pago en efectivo',
    credito: 'Tarjeta de crédito',
    debito: 'Tarjeta de débito',
  }), []);

  const resetSuccessState = () => {
    setShowSuccess(false);
    setSuccessData(null);
    setPaidTotal(null);
    setSaleTicket(null);
  };

  return (
    <div className='flex flex-col h-full overflow-hidden' style={{color:'var(--pos-text-heading)'}}>
  <header className='pb-2 border-b mb-2 flex-none' style={{borderColor:'var(--pos-summary-border)'}}>
  <h2 className='text-base font-semibold' style={{color:'var(--pos-text-heading)'}}>Carrito</h2>
        <p className='text-xs mt-0.5' style={{color:'var(--pos-text-muted)'}}>Gestiona la orden actual</p>
      </header>
  <div className='flex-1 overflow-y-auto pr-1 space-y-2 pb-1 custom-scroll-area'>
        {!hasItems && (
          <div className='mt-10 text-center px-4'>
            <svg viewBox='0 0 24 24' className='w-12 h-12 mx-auto text-slate-300' fill='none' stroke='currentColor' strokeWidth='1.4'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M3 3h2l2 13h10l2-10H6' />
              <circle cx='9' cy='19' r='1'/>
              <circle cx='16' cy='19' r='1'/>
            </svg>
            <p className='text-sm font-medium text-slate-600 mt-3'>Tu carrito está vacío</p>
            <p className='text-[12px] text-slate-500 mt-1'>Agrega productos para comenzar la orden.</p>
          </div>
        )}

        {!loading && items.map(item => (
          <div key={item.product.id} className='group relative rounded-xl border p-2.5 shadow-sm hover:shadow-md transition-shadow' style={{background:'var(--pos-card-bg)', borderColor:'var(--pos-card-border)'}}>
            <div className='flex items-start gap-3'>
              <div className='flex-1'>
                <p className='text-[13px] font-medium' style={{color:'var(--pos-text-heading)'}}>{item.product.name}</p>
                <p className='text-[11px] mt-0.5' style={{color:'var(--pos-text-muted)'}}>${item.product.price.toFixed(2)}</p>
                {item.note && (
                  <p className='text-[11px] mt-0.5 italic' style={{ color: 'var(--pos-text-muted)' }}>Nota: {item.note}</p>
                )}
                <div className='flex items-center gap-1.5 mt-2'>
                  <button onClick={()=> dec(item.lineId)} className='w-6 h-6 rounded flex items-center justify-center text-[15px] leading-none focus:outline-none focus-visible:ring-2' style={{background:'var(--pos-badge-stock-bg)', color:'var(--pos-chip-text)'}}>−</button>
                  <span className='text-[12px] font-medium w-6 text-center tabular-nums' style={{color:'var(--pos-text-heading)'}}>{item.qty}</span>
                  <button onClick={()=> inc(item.lineId)} className='w-6 h-6 rounded flex items-center justify-center text-[15px] leading-none focus:outline-none focus-visible:ring-2' style={{background:'var(--pos-badge-stock-bg)', color:'var(--pos-chip-text)'}}>+</button>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-[12px] font-semibold tabular-nums' style={{color:'var(--pos-text-heading)'}}>${(item.product.price * item.qty).toFixed(2)}</p>
                <div className='flex items-center gap-2 justify-end mt-2'>
                  <button onClick={()=> setEditLineId(item.lineId)} className='inline-flex items-center gap-1 text-[11px] focus:outline-none rounded px-1 opacity-90 hover:opacity-100 transition' style={{color:'var(--pos-text-muted)'}}>
                    <svg viewBox='0 0 24 24' className='w-3.5 h-3.5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                      <path d='M12 20h9' /><path d='M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' />
                    </svg>
                    Editar
                  </button>
                  <button onClick={async ()=> {
                    const ok = await confirm({
                      title: 'Quitar del carrito',
                      description: '¿Seguro que quieres quitar este producto? Esta acción no se puede deshacer.',
                      confirmText: 'Quitar',
                      cancelText: 'Cancelar',
                      tone: 'danger'
                    });
                    if (ok) remove(item.lineId);
                  }} className='inline-flex items-center gap-1 text-[11px] focus:outline-none rounded px-1 opacity-90 hover:opacity-100 transition' style={{color:'var(--pos-danger-text)'}}>
                  <svg viewBox='0 0 24 24' className='w-3.5 h-3.5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M3 6h18' />
                    <path d='M8 6V4h8v2' />
                    <path d='M19 6l-1 14H6L5 6' />
                  </svg>
                  Quitar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

  <div className='mt-1 pt-2 border-t border-transparent flex-none space-y-3'>
        {/* Resumen */}
        <div className='mt-2 relative'>
          <div
            className='rounded-xl p-2.5 text-[12px] shadow-sm'
            style={{
              background:'var(--pos-card-bg)',
              color:'var(--pos-text-muted)'
            }}
          >
            <dl className='space-y-1.5'>
              <div className='flex justify-between'>
                <dt>Subtotal</dt>
                <dd className='tabular-nums font-medium' style={{color:'var(--pos-text-heading)'}}>
                  {`$${subtotal.toFixed(2)}`}
                </dd>
              </div>
              <div className='flex justify-between'>
                <dt>Productos</dt>
                <dd className='tabular-nums font-medium' style={{color:'var(--pos-text-heading)'}}>{items.length}</dd>
              </div>
              <div className='pt-2 mt-1 flex justify-between items-baseline'>
                <dt className='text-[11px] uppercase tracking-wide font-medium' style={{color:'var(--pos-text-muted)'}}>Total</dt>
                <dd
                  className='tabular-nums text-[15px] font-semibold'
                  style={{color:'var(--pos-text-heading)'}}
                  aria-live='polite'
                  aria-atomic='true'
                >
                  {`$${total.toFixed(2)}`}
                </dd>
              </div>
            </dl>
          </div>
        </div>

  <div className='flex gap-2 pt-2 pb-2'>
          {/* Botón animado: Continuar con el pago */}
          <button
            type='button'
            disabled={!hasItems}
            aria-label='Continuar con el pago'
            className='
              group relative overflow-hidden flex-1
              h-12 px-6 rounded-full
              bg-white shadow-sm ring-1 ring-[var(--pos-card-border)]
              text-sm md:text-base font-semibold tracking-tight
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-shadow hover:shadow-md
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pos-accent-green)]
            '
            onClick={()=> setShowPayment(true)}
          >
            {/* Fondo expansible (círculo turquesa que se expande a todo el botón) */}
            <span
              aria-hidden='true'
              className='
                absolute inset-0 z-0 bg-[var(--pos-accent-green)]
                [clip-path:circle(14px_at_24px_50%)]
                group-hover:[clip-path:circle(140%_at_50%_50%)]
                transition-[clip-path] duration-500 ease-out
              '
            />
            {/* Flecha que viaja de izquierda a derecha */}
            <span
              aria-hidden='true'
              className='
                absolute top-1/2 -translate-y-1/2 z-10
                left-2 w-8 h-8 flex items-center justify-center
                transition-[left] duration-500 ease-out
                group-hover:left-[calc(100%-2.5rem)]
              '
            >
              <svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='white' strokeWidth={2.5} strokeLinecap='round' strokeLinejoin='round'>
                <path d='M5 12h14M13 6l6 6-6 6' />
              </svg>
            </span>
            {/* Texto que cambia a blanco cuando el fondo se vuelve turquesa */}
            <span
              className='
                relative z-10
                text-[var(--pos-text-heading)]
                transition-colors duration-300
                group-hover:text-white
              '
            >
              Pagar
            </span>
          </button>
          
          <button disabled={!hasItems} onClick={async ()=>{
            const ok = await confirm({
              title: 'Limpiar carrito',
              description: 'Vas a eliminar todos los productos del carrito. ¿Continuar?',
              confirmText: 'Limpiar',
              cancelText: 'Cancelar',
              tone: 'danger'
            });
            if (ok) clear();
          }} className='h-10 px-3 rounded-lg text-[12px] font-medium disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2' style={{background:'var(--pos-badge-stock-bg)', color:'var(--pos-chip-text)'}}>Limpiar</button>
        </div>
        {showPayment && (
          <PaymentPanel
            totalDue={total}
            onClose={()=> setShowPayment(false)}
            onConfirm={async (data)=>{
              // 1) Persistir la venta en backend
              try {
                const businessId = activeBusiness.get() || process.env.NEXT_PUBLIC_NEGOCIO_ID || '1';
                // Nota: backend exige items con id_producto (string), cantidad (number), precio_unitario opcional
                const saleItems = items.map(i => ({ id_producto: i.product.id, cantidad: i.qty }));
                const snapshotLines: TicketLine[] = items.map(line => ({
                  name: line.product.name,
                  qty: line.qty,
                  unitPrice: line.product.price,
                  total: line.product.price * line.qty,
                  note: line.note,
                  sku: line.product.id,
                }));

                const saleResponse = await api.createSale({ id_negocio: String(businessId), items: saleItems, cerrar: true });

                const detalle = Array.isArray(saleResponse?.detalle_venta) ? saleResponse.detalle_venta : [];
                const lines: TicketLine[] = detalle.length
                  ? detalle.map((detalleItem: any) => {
                      const unitPrice = Number(detalleItem?.precio_unitario ?? detalleItem?.producto?.precio ?? 0);
                      const quantity = Number(detalleItem?.cantidad ?? 0);
                      return {
                        name: detalleItem?.producto?.nombre ?? 'Producto',
                        qty: quantity,
                        unitPrice,
                        total: unitPrice * quantity,
                        note: detalleItem?.nota ?? undefined,
                        sku: detalleItem?.producto?.codigo_barras ? String(detalleItem.producto.codigo_barras) : undefined,
                      };
                    })
                  : snapshotLines;

                const subtotalFromLines = lines.reduce<number>((sum, line) => sum + line.total, 0);
                const discountValue = typeof discount === 'number' ? discount : 0;
                const ticketTotal = saleResponse?.total != null ? Number(saleResponse.total) : Math.max(0, subtotalFromLines - discountValue);

                const ticket: PaymentTicketData = {
                  saleId: saleResponse?.id_venta ? String(saleResponse.id_venta) : undefined,
                  folio: saleResponse?.folio_pos || saleResponse?.folio || undefined,
                  orderId: saleResponse?.pedido?.id_pedido ? String(saleResponse.pedido.id_pedido) : undefined,
                  businessId: business?.id_negocio ?? undefined,
                  businessName: business?.nombre ?? undefined,
                  businessAddress: business?.direccion ?? undefined,
                  businessPhone: business?.telefono ?? undefined,
                  issuedAt: saleResponse?.fecha_venta ?? new Date().toISOString(),
                  cashierName: saleResponse?.usuarios?.nombre ?? user?.nombre ?? undefined,
                  lines,
                  subtotal: subtotalFromLines || subtotal,
                  discount: discountValue,
                  total: ticketTotal,
                  methodLabel: saleResponse?.tipo_pago?.tipo ?? methodLabels[data.method] ?? 'Pago',
                  methodCode: saleResponse?.tipo_pago?.id_tipo_pago ?? data.method,
                  amountReceived: data.amountReceived ?? ticketTotal,
                  change: data.change,
                  reference: saleResponse?.referencia || saleResponse?.reference || undefined,
                  orderStatus: saleResponse?.pedido?.estado ?? undefined,
                };

                setSaleTicket(ticket);

                const finalTotal = ticket.total;
                setPaidTotal(finalTotal);
                setShowPayment(false);
                setSuccessData({ method: data.method, amountReceived: data.amountReceived, change: data.change });
                setShowSuccess(true);
                clear();
              } catch (err: any) {
                console.error('[POS] Error al crear la venta', err);
                alert(`No se pudo registrar la venta: ${err?.message || 'Error desconocido'}`);
              }
            }}
          />
        )}

        {showSuccess && successData && (
          <PaymentSuccessPanel
            total={paidTotal ?? saleTicket?.total ?? total}
            method={successData.method}
            received={successData.amountReceived}
            ticket={saleTicket}
            onClose={resetSuccessState}
            onShare={()=>{/* TODO: share receipt */}}
            onPrint={()=>{/* reservado para métricas */}}
          />
        )}
        {editLineId && (()=>{
          const line = items.find(i => i.lineId === editLineId);
          if (!line) return null;
          return (
            <AddToCartPanel
              key={line.lineId}
              product={line.product}
              lineId={line.lineId}
              initialQty={line.qty}
              initialNote={line.note}
              onClose={()=> setEditLineId(null)}
            />
          );
        })()}
      </div>
    </div>
  );
};
