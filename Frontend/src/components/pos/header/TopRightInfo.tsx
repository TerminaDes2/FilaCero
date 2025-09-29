"use client";
import React, { useMemo } from 'react';

export interface TopRightInfoProps {
  employeeName?: string;
  role?: string;
  businessName?: string;
  date?: Date;
  onNotificationsClick?: () => void;
}

export const TopRightInfo: React.FC<TopRightInfoProps> = ({
  employeeName = "Empleado",
  role = "Rol",
  businessName = "FilaCero",
  date,
  onNotificationsClick
}) => {
  const today = useMemo(() => date ?? new Date(), [date]);
  const formatted = useMemo(() =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'full' }).format(today)
  , [today]);

  return (
    <aside className="flex flex-col items-end gap-1 select-none" aria-label="Información superior derecha">
      {/* Nivel 1 */}
      <div className="flex items-start gap-3">
        {/* Botón Notificaciones */}
        <button
          type="button"
          onClick={onNotificationsClick}
          aria-label="Ver notificaciones"
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm focus:outline-none focus-visible:ring-2"
          style={{ background: 'rgba(255,255,255,0.7)', color: '#6d2530', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a3 3 0 0 0 6 0" />
          </svg>
        </button>

        {/* Separador */}
        <span className="self-stretch w-px" style={{ background: 'var(--pos-border-soft)' }} aria-hidden="true" />

        {/* Nombre y rol */}
        <div className="leading-tight text-right">
          <div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>{employeeName}</div>
          <div className="text-[11px]" style={{ color: 'var(--pos-text-muted)' }}>{role}</div>
        </div>
      </div>

      {/* Nivel 2 */}
      <div className="text-right">
        <div className="font-semibold tracking-tight text-lg md:text-xl" style={{ color: 'var(--pos-text-heading)' }}>{businessName}</div>
        <div className="text-[11px] md:text-xs" style={{ color: 'var(--pos-text-muted)' }}>{formatted}</div>
      </div>
    </aside>
  );
};

export default TopRightInfo;
