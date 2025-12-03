"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useEmployeesStore } from '../../../pos/employeesStore';
import { useTranslation } from '../../../hooks/useTranslation';

interface NewEmployeePanelProps {
  businessId: string;
  onClose: () => void;
  onEmployeeCreated?: () => void;
}

export function NewEmployeePanel({ businessId, onClose, onEmployeeCreated }: NewEmployeePanelProps) {
  const { t } = useTranslation();
  const { addEmployee, updateEmployeeStatus } = useEmployeesStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [initialStatus, setInitialStatus] = useState<'activo' | 'inactivo'>('activo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // UX: focus y tecla Esc como en paneles POS
  useEffect(() => {
    const t = setTimeout(() => nameInputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t('pos.employees.form.errors.emailRequired'));
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('pos.employees.form.errors.emailInvalid'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const created = await addEmployee(businessId, email, name || undefined);
      // Si el usuario eligió estado inicial inactivo, actualizar inmediatamente
      if (initialStatus === 'inactivo' && created?.id_empleado) {
        await updateEmployeeStatus(created.id_empleado, 'inactivo');
      }
      onEmployeeCreated?.();
      onClose();
    } catch (err: any) {
      console.error('Error al agregar empleado:', err);
      setError(err.message || t('pos.employees.form.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <>
      {/* Overlay como en categorías */}
      <button aria-label={t('pos.employees.form.aria.closeEditor')} onClick={handleClose} className='fixed inset-0 bg-black/35 backdrop-blur-[1px] cursor-default z-[90]' />

      {/* Panel derecho estilo POS */}
      <aside className='fixed right-0 top-0 h-screen w-[92vw] sm:w-[420px] md:w-[440px] shadow-2xl z-[110] flex flex-col'
             style={{ background:'var(--pos-card-bg)', borderLeft:'1px solid var(--pos-card-border)' }}>
        {/* Header */}
        <div className='px-5 py-4 border-b flex items-center gap-3' style={{ borderColor:'var(--pos-card-border)' }}>
          <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ background:'var(--pos-badge-stock-bg)', color:'var(--pos-chip-text)' }}>
            <svg viewBox='0 0 24 24' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z' />
              <path d='M5 20v-1c0-2.5 3.5-4 7-4s7 1.5 7 4v1' />
            </svg>
          </div>
          <div className='flex-1 min-w-0'>
            <div className='text-[11px] font-semibold uppercase tracking-wide' style={{ color:'var(--pos-text-muted)' }}>{t('pos.employees.form.badge.new')}</div>
            <h2 className='text-xl font-extrabold truncate' style={{ color:'var(--pos-text-heading)' }}>{name ? name : (email || t('pos.employees.form.fallbackName'))}</h2>
          </div>
          <button onClick={handleClose} disabled={isSubmitting} className='w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2 transition-colors disabled:opacity-50' style={{ background:'var(--pos-accent-green)' }}>✕</button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {error && (
            <div className='text-[12px] text-rose-700 bg-rose-50/80 border border-rose-200/70 rounded-md px-3 py-2'>
              {error}
            </div>
          )}

          {/* Información básica */}
          <section className='rounded-2xl p-4 space-y-3' style={{ background:'var(--pos-bg-sand)', border:'1px solid var(--pos-border-soft)' }}>
            <h3 className='text-sm font-extrabold' style={{ color:'var(--pos-text-heading)' }}>{t('pos.employees.form.sections.basicInfo')}</h3>
            <div>
              <label className='block text-xs mb-1 font-semibold' style={{ color:'var(--pos-text-heading)' }}>{t('pos.employees.form.fields.email')}</label>
              <input ref={nameInputRef as any} type='email' value={email} onChange={(e)=> setEmail(e.target.value)} placeholder='empleado@ejemplo.com'
                     className='w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2'
                     style={{ height:'var(--pos-control-h)', borderRadius:'var(--pos-control-radius)', background:'var(--pos-card-bg)', border:'1px solid var(--pos-card-border)', color:'var(--pos-text-heading)' }} required />
            </div>
            <div className='grid grid-cols-1 gap-3'>
              <div>
                <label className='block text-xs mb-1 font-semibold' style={{ color:'var(--pos-text-heading)' }}>{t('pos.employees.form.fields.fullName')}</label>
                <input value={name} onChange={(e)=> setName(e.target.value)} placeholder='Juan Pérez'
                       className='w-full rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2'
                       style={{ height:'var(--pos-control-h)', borderRadius:'var(--pos-control-radius)', background:'var(--pos-card-bg)', border:'1px solid var(--pos-card-border)', color:'var(--pos-text-heading)' }} />
                <p className='text-[11px] mt-1' style={{ color:'var(--pos-text-muted)' }}>{t('pos.employees.form.helper.nameFromEmail')}</p>
              </div>
            </div>
          </section>

          {/* Estado inicial */}
          <section className='rounded-2xl p-4 space-y-3' style={{ background:'var(--pos-card-bg)', border:'1px solid var(--pos-card-border)' }}>
            <h3 className='text-sm font-extrabold' style={{ color:'var(--pos-text-heading)' }}>{t('pos.employees.form.sections.initialStatus')}</h3>
            <div className='flex items-center gap-2'>
              <button type='button' onClick={()=> setInitialStatus('activo')} className={`px-3 py-1.5 rounded-lg text-sm ${initialStatus==='activo' ? 'text-white' : ''}`}
                      style={{ background: initialStatus==='activo' ? 'var(--pos-accent-green)' : 'rgba(0,0,0,0.06)' }}>
                {t('pos.employees.form.status.active')}
              </button>
              <button type='button' onClick={()=> setInitialStatus('inactivo')} className={`px-3 py-1.5 rounded-lg text-sm ${initialStatus==='inactivo' ? 'text-white' : ''}`}
                      style={{ background: initialStatus==='inactivo' ? '#6b7280' : 'rgba(0,0,0,0.06)' }}>
                {t('pos.employees.form.status.inactive')}
              </button>
            </div>
            <p className='text-[11px]' style={{ color:'var(--pos-text-muted)' }}>{t('pos.employees.form.helper.initialStatus')}</p>
          </section>
        </div>

        {/* Footer */}
        <div className='p-5 border-t flex items-center justify-between gap-2' style={{ borderColor:'var(--pos-card-border)' }}>
          <div className='text-[11px] text-[var(--pos-text-muted)] hidden sm:block'>{t('pos.common.hints.escToClose')}</div>
          <div className='ml-auto flex items-center gap-2'>
                <button onClick={handleClose} className='px-4 rounded-lg text-sm font-semibold transition-colors'
                  style={{ height:'var(--pos-control-h)', borderRadius:'var(--pos-control-radius)', background:'var(--pos-card-bg)', border:'1px solid var(--pos-card-border)', color:'var(--pos-text-heading)' }} disabled={isSubmitting}>
                  {t('common.actions.cancel')}
                </button>
            <button onClick={handleSubmit} className='px-5 rounded-full text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60 focus:outline-none focus-visible:ring-2'
                  style={{ height:'var(--pos-control-h)', background:'var(--pos-accent-green)' }} disabled={isSubmitting || !email.trim()}>
                  {isSubmitting
              ? t('pos.employees.form.actions.creating')
              : t('pos.employees.form.actions.add')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
