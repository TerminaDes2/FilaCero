"use client";
import React from 'react';
import { useUserStore, AppRole } from '../../state/userStore';

interface RoleSelectorProps {
  compact?: boolean;
  onChange?: (role: AppRole) => void;
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
    title: 'Dueño',
    desc: 'Gestiona tu cafetería',
    icon: <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 10h8" /><path d="M8 14h5" /></svg>
  }
];

export const RoleSelector: React.FC<RoleSelectorProps> = ({ compact, onChange }) => {
  const { role, setRole } = useUserStore();

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${compact ? 'mt-2' : 'mt-4'}`}>
      {roles.map(r => {
        const active = role === r.key;
        const activeGradient = 'bg-gradient-to-br from-brand-500 to-brand-400';
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => { setRole(r.key); onChange?.(r.key); }}
            className={`relative rounded-xl border text-left p-4 group transition focus:outline-none focus:ring-2 focus:ring-brand-400/60
              ${active ? 'border-transparent ' + activeGradient + ' text-white shadow-md shadow-brand-500/30' : 'border-gray-300/60 dark:border-slate-600/60 bg-white/70 dark:bg-slate-800/60 hover:border-brand-400/60'}
            `}
            aria-pressed={active}
          >
            <div className="flex items-start gap-3">
              <span className={`inline-flex items-center justify-center rounded-lg w-9 h-9 shadow transition-colors ${active ? activeGradient + ' text-white ring-2 ring-white/60' : 'bg-[#FCE8B7] text-[#664625] dark:text-[#FCE8B7]'} `}>
                {/* Clone icon to ensure stroke picks up currentColor */}
                {React.cloneElement(r.icon as React.ReactElement, { className: 'w-5 h-5', stroke: 'currentColor' })}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold tracking-tight ${active ? 'text-white' : 'text-gray-800 dark:text-slate-100'}`}>{r.title}</p>
                <p className={`text-[11px] mt-0.5 leading-tight ${active ? 'text-white/90' : 'text-gray-700 dark:text-slate-400'}`}>{r.desc}</p>
              </div>
            </div>
            {/* Active outline overlay */}
            {active && (
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/50 dark:ring-white/20" />
            )}
          </button>
        );
      })}
    </div>
  );
};
