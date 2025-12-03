"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useCategoriesStore, CategoryColor } from '../../../pos/categoriesStore';
import { api } from '../../../lib/api';
import { useTranslation } from '../../../hooks/useTranslation';

interface NewCategoryPanelProps {
  onClose: () => void;
  onCreated?: () => void;
}

const colorTokens: Record<CategoryColor, { bg: string; fg: string; ring: string; dot: string; label: string }> = {
  brand: { bg: 'bg-brand-600/12', fg: 'text-brand-700', ring: 'ring-brand-500/30', dot: 'bg-brand-500', label: 'Brand' },
  teal: { bg: 'bg-[color:var(--fc-teal-500)]/12', fg: 'text-[color:var(--fc-teal-600)]', ring: 'ring-[color:var(--fc-teal-500)]/30', dot: 'bg-[color:var(--fc-teal-500)]', label: 'Teal' },
  amber: { bg: 'bg-amber-500/12', fg: 'text-amber-700', ring: 'ring-amber-500/30', dot: 'bg-amber-500', label: 'Amber' },
  gray: { bg: 'bg-slate-500/12', fg: 'text-slate-700', ring: 'ring-slate-500/30', dot: 'bg-slate-500', label: 'Gray' },
  rose: { bg: 'bg-rose-500/12', fg: 'text-rose-700', ring: 'ring-rose-500/30', dot: 'bg-rose-500', label: 'Rose' }
};

export const NewCategoryPanel: React.FC<NewCategoryPanelProps> = ({ onClose, onCreated }) => {
  const { t } = useTranslation();
  const { add, categories } = useCategoriesStore();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [applyAll, setApplyAll] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<CategoryColor>('brand');
  const [icon, setIcon] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // UX: focus and Esc key
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // --- 👇 CÓDIGO MODIFICADO ---
  useEffect(() => {
    // Cargar negocios del usuario para permitir selección sucursal
    (async () => {
      try {
        const list = await api.listMyBusinesses();
        setBusinesses(list || []);
        if (list?.length === 1) {
          setSelectedBusiness(String(list[0].id_negocio));
        }
      } catch (e) {
        console.warn('No se pudieron cargar negocios', e);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    setError('');
    const n = name.trim();
    if (!n) {
      setError(t('pos.categories.form.errors.nameRequired'));
      return;
    }
    const duplicate = categories.some(c => c.name.toLowerCase() === n.toLowerCase());
    if (duplicate) {
      setError(t('pos.categories.form.errors.nameDuplicate'));
      return;
    }
    if (icon && icon.length > 2) {
      setError(t('pos.categories.form.errors.emojiLength'));
      return;
    }
    
    // Validaciones negocio / aplicarTodos
    if (businesses.length > 1 && !applyAll && !selectedBusiness) {
      setError(t('pos.categories.form.errors.branchOrAll'));
      return;
    }
    setSaving(true);
    try {
      const opts = {
        aplicarTodos: applyAll || businesses.length === 1,
        sucursal: !applyAll && businesses.length > 1 ? businesses.find(b => String(b.id_negocio) === selectedBusiness)?.nombre : undefined,
      };
      await add(n, color, icon || undefined, opts);
      onCreated?.();
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('pos.categories.form.errors.generic');
      setError(message);
    } finally {
      setSaving(false);
    }
  };
  // --- FIN DEL CÓDIGO MODIFICADO ---

  const tokens = colorTokens[color];

  return (
    <>
      {/* Overlay */}
      <button aria-label='Cerrar editor' onClick={onClose} className='fixed inset-0 bg-black/35 backdrop-blur-[1px] cursor-default z-[90]' />

      {/* Panel */}
      <aside className='fixed right-0 top-0 h-screen w-[92vw] sm:w-[420px] md:w-[440px] shadow-2xl z-[110] flex flex-col' style={{ background: 'var(--pos-card-bg)', borderLeft: '1px solid var(--pos-card-border)' }}>
        {/* Header estilo POS */}
        <div className='px-5 py-4 border-b flex items-center gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
          <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ background: 'var(--pos-badge-stock-bg)', color: 'var(--pos-chip-text)' }}>
            <svg viewBox='0 0 24 24' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
              <circle cx='12' cy='12' r='7' />
              <path d='M12 8v8M8 12h8' />
            </svg>
          </div>
          <div className='flex-1 min-w-0'>
            <div className='text-[11px] font-semibold uppercase tracking-wide' style={{ color: 'var(--pos-text-muted)' }}>{t('pos.categories.form.badge.new')}</div>
            <h2 className='text-xl font-extrabold truncate' style={{ color: 'var(--pos-text-heading)' }}>{icon ? `${icon} ` : ''}{name || t('pos.categories.form.fallbackName')}</h2>
          </div>
          <button onClick={onClose} className='w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2 transition-colors' style={{ background: 'var(--pos-accent-green)' }}>✕</button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {error && (
            <div className='text-[12px] text-rose-700 bg-rose-50/80 border border-rose-200/70 rounded-md px-3 py-2'>
              {error}
            </div>
          )}

          {/* Información básica */}
          <section className='rounded-2xl p-4 space-y-3' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-border-soft)' }}>
            <h3 className='text-sm font-extrabold' style={{ color: 'var(--pos-text-heading)' }}>{t('pos.categories.form.sections.basicInfo')}</h3>
            <div>
              <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>{t('pos.categories.form.fields.name')}</label>
              <input ref={nameInputRef} value={name} onChange={e => setName(e.target.value)} className='w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' style={{ height: 'var(--pos-control-h)', borderRadius: 'var(--pos-control-radius)', background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>{t('pos.categories.form.fields.color')}</label>
                <div className='relative'>
                  <select value={color} onChange={e => setColor(e.target.value as CategoryColor)} className='appearance-none w-full rounded-lg pl-3 pr-8 text-sm focus:outline-none focus-visible:ring-2' style={{ height: 'var(--pos-control-h)', borderRadius: 'var(--pos-control-radius)', background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}>
                    {Object.keys(colorTokens).map(c => (
                      <option key={c} value={c}>{colorTokens[c as CategoryColor].label}</option>
                    ))}
                  </select>
                  <svg aria-hidden viewBox='0 0 24 24' className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' style={{ color: 'var(--pos-text-muted)' }}>
                    <path d='M6 9l6 6 6-6' />
                  </svg>
                </div>
              </div>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>{t('pos.categories.form.fields.emoji')}</label>
                <input value={icon} onChange={e => setIcon(e.target.value)} className='w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' placeholder='🍹' style={{ height: 'var(--pos-control-h)', borderRadius: 'var(--pos-control-radius)', background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
              </div>
            </div>
            {/* Negocio / Aplicar a todos */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label className='block text-xs font-semibold' style={{ color: 'var(--pos-text-heading)' }}>{t('pos.categories.form.fields.branch')}</label>
                <label className='inline-flex items-center gap-2 text-xs'>
                  <input type='checkbox' className='accent-[var(--pos-accent-green)]' checked={applyAll} onChange={e => setApplyAll(e.target.checked)} />
                  <span style={{ color: 'var(--pos-text-muted)' }}>{t('pos.categories.form.fields.applyAll')}</span>
                </label>
              </div>
              <select
                value={selectedBusiness}
                onChange={e => setSelectedBusiness(e.target.value)}
                disabled={applyAll || businesses.length <= 1}
                className='w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2'
                style={{ height: 'var(--pos-control-h)', borderRadius: 'var(--pos-control-radius)', background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}
              >
                {businesses.length === 0 && <option value=''>{t('pos.categories.form.business.none')}</option>}
                {businesses.length === 1 && <option value={String(businesses[0].id_negocio)}>{businesses[0].nombre}</option>}
                {businesses.length > 1 && !applyAll && <option value=''>{t('pos.categories.form.business.select')}</option>}
                {businesses.map(b => (
                  <option key={b.id_negocio} value={String(b.id_negocio)}>{b.nombre}</option>
                ))}
              </select>
              {businesses.length > 1 && !applyAll && !selectedBusiness && (
                <p className='text-[11px] text-amber-600'>{t('pos.categories.form.business.requiredIfNotAll')}</p>
              )}
            </div>
          </section>

          {/* Vista previa */}
          <section className='rounded-2xl p-4 space-y-3' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)' }}>
            <div className='text-xs font-semibold uppercase tracking-wide' style={{ color: 'var(--pos-text-muted)' }}>{t('pos.categories.form.preview.title')}</div>
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ${tokens.ring} ${tokens.bg}`}>
              <span className={`inline-block w-2 h-2 rounded-full ${tokens.dot}`} />
              <span className={`text-sm font-medium ${tokens.fg}`}>{icon ? `${icon} ` : ''}{name || t('pos.categories.form.fallbackName')}</span>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className='p-5 border-t flex items-center justify-between gap-2' style={{ borderColor: 'var(--pos-card-border)' }}>
          <div className='text-[11px] text-[var(--pos-text-muted)] hidden sm:block'>{t('pos.common.hints.escToClose')}</div>
          <div className='ml-auto flex items-center gap-2'>
            <button onClick={onClose} className='px-4 rounded-lg text-sm font-semibold transition-colors' style={{ height: 'var(--pos-control-h)', borderRadius: 'var(--pos-control-radius)', background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} disabled={saving}>
              {t('common.actions.cancel')}
            </button>
            <button onClick={handleSubmit} className='px-5 rounded-full text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60 focus:outline-none focus-visible:ring-2' style={{ height: 'var(--pos-control-h)', background: 'var(--pos-accent-green)' }} disabled={saving}>
              {saving ? t('pos.categories.form.actions.creating') : t('pos.categories.form.actions.create')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default NewCategoryPanel;