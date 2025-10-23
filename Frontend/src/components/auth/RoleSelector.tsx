"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useUserStore, AppRole } from '../../state/userStore';

interface RoleSelectorProps {
  compact?: boolean;
  onChange?: (role: AppRole) => void;
  nameHint?: string;
  emailHint?: string;
  showContext?: boolean;
}

const roles: { key: Exclude<AppRole, null>; title: string; desc: string; icon: React.ReactNode }[] = [
  {
    key: 'CUSTOMER',
    title: 'Cliente',
    desc: 'Pide y recoge más rápido',
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h15l-1.5 9h-13z" /><path d="M6 6l-2 0" /><circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>
  },
  {
    key: 'OWNER',
    title: 'Negocio',
    desc: 'Gestiona tu cafetería',
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 10h8" /><path d="M8 14h5" /></svg>
  }
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ compact, onChange, nameHint, emailHint, showContext = true }) => {
  const { role, setRole } = useUserStore();
  const [nameFromLS, setNameFromLS] = useState<string | undefined>();
  const [emailFromLS, setEmailFromLS] = useState<string | undefined>();

  // Intentar recuperar contexto básico si existe (no bloqueante)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const userRaw = window.localStorage.getItem('auth_user');
        if (userRaw) {
          const parsed = JSON.parse(userRaw);
          if (parsed?.name) setNameFromLS(parsed.name as string);
          if (parsed?.email) setEmailFromLS(parsed.email as string);
        }
      }
    } catch {}
  }, []);

  const handleRoleSelect = (selectedRole: AppRole) => {
    setRole(selectedRole);
    onChange?.(selectedRole); // Llama al callback cuando se selecciona un rol
  };

  const displayName = nameHint || nameFromLS;
  const displayEmail = emailHint || emailFromLS;

  return (
    <div className={`${compact ? 'mt-2' : 'mt-4'}`}>
      {showContext && (
        <div className={`mb-3 ${compact ? 'space-y-1' : 'space-y-1.5'}`}>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/80 ring-1 ring-black/5 text-[11px] text-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--fc-brand-600)]" />
            Continuando tu registro
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} text-gray-900`}>{displayName ? `Hola, ${displayName}` : 'Elige tu tipo de cuenta'}</h3>
            {displayEmail && (
              <span className="text-[11px] text-gray-600">Usaremos <span className="font-medium text-gray-800">{displayEmail}</span></span>
            )}
          </div>
          <p className="text-[11px] text-gray-600">Esto nos ayuda a personalizar tu experiencia desde el inicio.</p>
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3`}>
      {roles.map(r => {
        const active = role === r.key;
        const isCustomer = r.key === 'CUSTOMER'
        const accent = isCustomer ? '#E94A6F' : '#4CC1AD'
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => handleRoleSelect(r.key)}
            className={`relative overflow-hidden rounded-2xl p-4 text-left group transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.995]
              ${active ? 'text-white shadow-md' : 'text-gray-800'}
            `}
            aria-pressed={active}
            style={{
              background: active
                ? `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`
                : 'rgba(255,255,255,0.70)'
            }}
          >
            {/* Ambient overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(closest-side, ${accent}22, transparent)`}} />
            {/* Badge icon */}
            <div className={`inline-flex items-center justify-center rounded-xl w-10 h-10 ring-1 ring-black/5 mb-2 ${active ? 'bg-white/20 text-white' : 'bg-white/70 text-gray-700'}`}>
              {React.cloneElement(r.icon as React.ReactElement, { className: 'w-5 h-5', stroke: 'currentColor' })}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-extrabold tracking-tight ${active ? 'text-white' : 'text-gray-900'}`}>{r.title}</p>
              <p className={`text-[11px] mt-0.5 leading-tight ${active ? 'text-white/90' : 'text-gray-700'}`}>{r.desc}</p>
            </div>
            {active && (
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/50" />
            )}
          </button>
        );
      })}
      </div>

      {/* Contextual hint about next step */}
      <div className="mt-2 text-[11px] text-gray-600">
        {role === 'OWNER' ? 'Luego configuraremos los datos de tu negocio.' : role === 'CUSTOMER' ? 'Luego podrás personalizar tu perfil.' : 'Luego podrás completar algunos detalles.'}
      </div>
      {/* Live region for accessibility when role changes */}
      <div className="sr-only" aria-live="polite">{role ? `Rol seleccionado: ${role === 'OWNER' ? 'Negocio' : 'Cliente'}` : ''}</div>
    </div>
  );
};