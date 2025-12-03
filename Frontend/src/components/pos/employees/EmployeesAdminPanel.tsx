"use client";
import React, { useEffect, useState } from 'react';
import { useEmployeesStore } from '../../../pos/employeesStore';
import { EmployeeCard } from './EmployeeCard';
import { useTranslation } from '../../../hooks/useTranslation';

interface EmployeesAdminPanelProps {
  businessId: string;
  search?: string;
  statusFilter?: 'all' | 'activo' | 'inactivo';
  view?: 'grid' | 'list';
  onNewEmployee?: () => void;
}

export function EmployeesAdminPanel({ 
  businessId, 
  search = '', 
  statusFilter = 'all',
  view = 'grid',
  onNewEmployee 
}: EmployeesAdminPanelProps) {
  const { t } = useTranslation();
  const { employees, loading, error, fetchEmployees } = useEmployeesStore();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (businessId) {
      fetchEmployees(businessId);
    }
  }, [businessId, refreshKey, fetchEmployees]);

  const filtered = employees.filter((emp) => {
    // Filtro de búsqueda
    const searchLower = search.toLowerCase().trim();
    const nombre = emp.usuario?.nombre ?? '';
    const correo = emp.usuario?.correo_electronico ?? '';
    const matchesSearch = !searchLower || 
      nombre.toLowerCase().includes(searchLower) ||
      correo.toLowerCase().includes(searchLower);

    // Filtro de estado
    const matchesStatus = statusFilter === 'all' || emp.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const activos = employees.filter(e => e?.estado === 'activo').length;
  const inactivos = employees.filter(e => e?.estado === 'inactivo').length;

  if (loading && employees.length === 0) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='animate-spin rounded-full h-10 w-10 border-b-2' style={{ borderColor: 'var(--fc-brand-600)' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-20 gap-3'>
        <div className='text-red-600 text-sm font-medium'>{t('pos.employees.error')}</div>
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          className='px-4 py-2 rounded-lg text-sm font-semibold'
          style={{ background: 'var(--fc-brand-600)', color: '#fff' }}
        >
          {t('common.actions.retry')}
        </button>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='rounded-2xl px-6 py-6 text-center shadow-sm' style={{ background: 'var(--pos-bg-white)', boxShadow: 'inset 0 0 0 1px var(--pos-border-soft)' }}>
          <h3 className='text-xl font-extrabold mb-2' style={{ color: 'var(--fc-brand-700)' }}>
            {t('pos.employees.empty.title')}
          </h3>
          <p className='text-sm mb-5 text-slate-600'>
            {t('pos.employees.empty.subtitle')}
          </p>
          {onNewEmployee && (
            <button
              onClick={onNewEmployee}
              className='px-5 py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
              style={{ background: 'var(--pos-accent-green)', color: '#fff' }}
            >
              {t('pos.employees.actions.addFirst')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='rounded-2xl px-6 py-6 text-center shadow-sm' style={{ background: 'var(--pos-bg-white)', boxShadow: 'inset 0 0 0 1px var(--pos-border-soft)' }}>
          <h3 className='text-xl font-extrabold mb-2' style={{ color: 'var(--fc-brand-700)' }}>
            {t('pos.employees.noResults.title')}
          </h3>
          <p className='text-sm text-slate-600'>
            {t('pos.employees.noResults.subtitle')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Stats */}
      <div className='flex gap-3 flex-wrap'>
        <div className='px-4 py-2 rounded-lg' style={{ background: 'var(--pos-bg-white)', border: '1px solid var(--pos-border-soft)' }}>
          <div className='text-xs opacity-60'>{t('pos.employees.stats.total')}</div>
          <div className='text-xl font-bold'>{employees.length}</div>
        </div>
        <div className='px-4 py-2 rounded-lg' style={{ background: 'var(--pos-bg-white)', border: '1px solid var(--pos-border-soft)' }}>
          <div className='text-xs opacity-60'>{t('pos.employees.stats.active')}</div>
          <div className='text-xl font-bold text-green-600'>{activos}</div>
        </div>
        <div className='px-4 py-2 rounded-lg' style={{ background: 'var(--pos-bg-white)', border: '1px solid var(--pos-border-soft)' }}>
          <div className='text-xs opacity-60'>{t('pos.employees.stats.inactive')}</div>
          <div className='text-xl font-bold text-gray-400'>{inactivos}</div>
        </div>
      </div>

      {/* Lista de empleados */}
      <div className={view === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        : 'flex flex-col gap-3'
      }>
        {filtered.map((employee) => (
          <EmployeeCard 
            key={employee.id_empleado} 
            employee={employee}
            view={view}
            onUpdate={() => setRefreshKey(k => k + 1)}
          />
        ))}
      </div>
    </div>
  );
}
