"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../../state/userStore';
import { useSettingsStore } from '../../../state/settingsStore';
import { useShortcuts } from '../../system/ShortcutProvider';

export interface TopRightInfoProps {
  employeeName?: string;
  role?: string;
  businessName?: string;
  date?: Date;
  onNotificationsClick?: () => void;
  showLogout?: boolean;
}

export const TopRightInfo: React.FC<TopRightInfoProps> = ({
  employeeName = "Empleado",
  role = "Rol",
  businessName = "FilaCero",
  date,
  onNotificationsClick,
  showLogout = false
}) => {
  const router = useRouter();
  const { reset } = useUserStore();
  const { locale, dateFormat } = useSettingsStore();
  let openHelp: (() => void) | null = null;
  try { ({ openHelp } = useShortcuts()); } catch {}
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const today = useMemo(() => date ?? new Date(), [date]);
  const formatted = useMemo(() => {
    if (!mounted) return '';
    try {
      // Use settings locale and optional custom format
      if (dateFormat && dateFormat !== 'auto') {
        const d = today;
        const pad = (n: number) => String(n).padStart(2, '0');
        const DD = pad(d.getDate());
        const MM = pad(d.getMonth() + 1);
        const YYYY = d.getFullYear();
        if (dateFormat === 'DD/MM/YYYY') return `${DD}/${MM}/${YYYY}`;
        if (dateFormat === 'MM/DD/YYYY') return `${MM}/${DD}/${YYYY}`;
        if (dateFormat === 'YYYY-MM-DD') return `${YYYY}-${MM}-${DD}`;
      }
      return new Intl.DateTimeFormat(locale || 'es-MX', { dateStyle: 'full' }).format(today);
    } catch {
      return '';
    }
  }, [today, mounted, locale, dateFormat]);

  const onLogout = () => {
    try { reset(); } catch {}
    router.push('/');
  };

  // Pull dynamic name/role from store as primary source
  const { name: storeName, backendRole } = useUserStore();
  const looksLikeEmail = (v?: string | null) => !!v && /.+@.+\..+/.test(v);
  const displayName = looksLikeEmail(storeName) ? (employeeName || 'Usuario') : (storeName || employeeName);
  const displayRole = (backendRole && typeof backendRole === 'string') ? (backendRole === 'admin' ? 'Administrador' : backendRole) : role;

  return (
    <aside className="flex flex-col items-end gap-1 select-none" aria-label="Información superior derecha">
      {/* Nivel 1 */}
      <div className="flex items-start gap-3">
        {/* Botón Ayuda (atajos) */}
        <button
          type="button"
          onClick={() => openHelp?.()}
          aria-label="Ver atajos del teclado"
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm focus:outline-none focus-visible:ring-2"
          style={{ background: 'rgba(255,255,255,0.7)', color: '#6d2530', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
          title="Atajos (?)"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8.5 9a3.5 3.5 0 1 1 5.657 2.657c-.6.5-1.157.99-1.157 1.843V14" />
          </svg>
        </button>
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

        {showLogout && (
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm focus:outline-none focus-visible:ring-2"
            style={{ background: 'rgba(255,255,255,0.7)', color: '#6d2530', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5M21 12H9M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
            </svg>
          </button>
        )}

        {/* Separador */}
        <span className="self-stretch w-px" style={{ background: 'var(--pos-border-soft)' }} aria-hidden="true" />

        {/* Nombre y rol */}
        <div className="leading-tight text-right">
          <div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>{displayName}</div>
          <div className="text-[11px]" style={{ color: 'var(--pos-text-muted)' }}>{displayRole}</div>
        </div>
      </div>

      {/* Nivel 2 */}
      <div className="text-right">
        <div className="font-semibold tracking-tight text-lg md:text-xl" style={{ color: 'var(--pos-text-heading)' }}>{businessName}</div>
        <div className="text-[11px] md:text-xs" style={{ color: 'var(--pos-text-muted)' }}>{mounted ? formatted : '\u00A0'}</div>
      </div>
    </aside>
  );
};

export default TopRightInfo;
