"use client";
import React, { useEffect, useState } from 'react';
import { PosSidebar } from '../../../src/components/pos/sidebar';
import { SearchBox } from '../../../src/components/pos/controls/SearchBox';
import { ViewToggle } from '../../../src/components/pos/controls/ViewToggle';
import { TopRightInfo } from '../../../src/components/pos/header/TopRightInfo';
import LanguageSelector from '../../../src/components/LanguageSelector';
import { EmployeesAdminPanel } from '../../../src/components/pos/employees/EmployeesAdminPanel';
import { NewEmployeePanel } from '../../../src/components/pos/employees/NewEmployeePanel';
import { useSettingsStore } from '../../../src/state/settingsStore';
import { useBusinessStore } from '../../../src/state/businessStore';
import { useTranslation } from '../../../src/hooks/useTranslation';

export default function EmployeesPage() {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const { activeBusiness } = useBusinessStore();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>(settings.defaultView);
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'inactivo'>('all');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Tomar id de negocio activo desde el store (establecido al iniciar sesión o por TopRightInfo)
  const businessId = activeBusiness?.id_negocio || '';

  // Keyboard: 'v' toggles view (grid/list) when not typing in input
  useEffect(() => {
    const isEditable = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return !!(el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select');
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isEditable(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setView(v => v === 'grid' ? 'list' : 'grid');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Keyboard: 'n' opens New Employee panel when not typing in input
  useEffect(() => {
    const isEditable = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return !!(el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select');
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isEditable(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsPanelOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const onEmployeeCreated = () => {
    setRefreshKey(k => k + 1);
    setIsPanelOpen(false);
  };

  return (
    <div className='h-screen flex pos-pattern overflow-hidden'>
      {/* Sidebar */}
      <aside className='hidden md:flex flex-col h-screen sticky top-0'>
        <PosSidebar />
      </aside>

      {/* Main */}
      <main className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'>
        {/* Header row: App brand left + TopRightInfo right */}
        <div className='px-5 relative z-10 mb-4 flex items-start justify-between gap-4'>
          <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
            <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
            <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
          </h1>
          <div className='flex items-center gap-4'>
            <LanguageSelector variant="compact" theme="light" />
            <TopRightInfo showLogout />
          </div>
        </div>

        {/* Panel area */}
        <section className='flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-8 pb-3 flex flex-col' style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 0 0 1px var(--pos-border-soft)' }}>
          <header className='space-y-3 mb-3 flex-none'>
            <div className='flex flex-col md:flex-row md:items-center gap-3'>
              <div className='flex-1 min-w-0'>
                <SearchBox 
                  value={search} 
                  onChange={setSearch}
                />
              </div>
              <div className='flex items-center flex-wrap gap-2'>
                {/* Status filter */}
                <div className='flex items-center gap-1 p-1 rounded-lg' style={{ background: 'var(--pos-bg-white)', border: '1px solid var(--pos-border-soft)' }}>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded text-sm font-semibold transition-all ${
                      statusFilter === 'all' ? 'text-white' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={statusFilter === 'all' ? { background: 'var(--fc-brand-600)' } : {}}
                  >
                    {t('pos.employees.filters.all')}
                  </button>
                  <button
                    onClick={() => setStatusFilter('activo')}
                    className={`px-3 py-1.5 rounded text-sm font-semibold transition-all ${
                      statusFilter === 'activo' ? 'text-white' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={statusFilter === 'activo' ? { background: '#16a34a' } : {}}
                  >
                    {t('pos.employees.filters.active')}
                  </button>
                  <button
                    onClick={() => setStatusFilter('inactivo')}
                    className={`px-3 py-1.5 rounded text-sm font-semibold transition-all ${
                      statusFilter === 'inactivo' ? 'text-white' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={statusFilter === 'inactivo' ? { background: '#6b7280' } : {}}
                  >
                    {t('pos.employees.filters.inactive')}
                  </button>
                </div>

                <ViewToggle value={view} onChange={setView} />
                
                <div className='ml-0 md:ml-2 flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start'>
                  <button 
                    onClick={() => setIsPanelOpen(true)} 
                    className='h-9 px-3 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2'
                    style={{ background: 'var(--pos-accent-green)', color: '#fff' }}
                  >
                    {t('pos.employees.actions.new')}
                  </button>
                </div>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className='flex gap-2 text-xs opacity-50'>
              <span className='px-2 py-1 rounded' style={{ background: 'var(--pos-bg-white)' }}>
                <kbd className='font-mono font-bold'>N</kbd> {t('pos.employees.keyboard.newEmployee')}
              </span>
              <span className='px-2 py-1 rounded' style={{ background: 'var(--pos-bg-white)' }}>
                <kbd className='font-mono font-bold'>V</kbd> {t('pos.employees.keyboard.changeView')}
              </span>
            </div>
          </header>

          <div className='flex-1 min-h-0 overflow-y-auto pr-1 pb-4 custom-scroll-area'>
            {businessId ? (
              <EmployeesAdminPanel 
                key={refreshKey}
                businessId={businessId}
                search={search} 
                statusFilter={statusFilter}
                view={view}
                onNewEmployee={() => setIsPanelOpen(true)}
              />
            ) : (
              <div className='flex flex-col items-center justify-center py-20 gap-3'>
                <div className='text-center'>
                  <h3 className='text-lg font-bold mb-2'>Sin negocio activo</h3>
                  <p className='text-sm opacity-70'>Inicia sesión como admin y selecciona un negocio para gestionar empleados.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {isPanelOpen && businessId && (
        <NewEmployeePanel 
          businessId={businessId}
          onClose={() => setIsPanelOpen(false)} 
          onEmployeeCreated={onEmployeeCreated} 
        />
      )}
    </div>
  );
}
