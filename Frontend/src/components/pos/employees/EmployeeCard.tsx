"use client";
import React, { useState } from 'react';
import { Employee, useEmployeesStore } from '../../../pos/employeesStore';

interface EmployeeCardProps {
  employee: Employee;
  view: 'grid' | 'list';
  onUpdate?: () => void;
}

export function EmployeeCard({ employee, view, onUpdate }: EmployeeCardProps) {
  const { updateEmployeeStatus, removeEmployee } = useEmployeesStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Protect against missing `usuario` payload coming from the API
  const user = employee.usuario ?? {
    nombre: 'Empleado',
    correo_electronico: '',
    avatar_url: '',
    numero_telefono: ''
  };

  const handleToggleStatus = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const newStatus = employee.estado === 'activo' ? 'inactivo' : 'activo';
      await updateEmployeeStatus(employee.id_empleado, newStatus);
      setIsMenuOpen(false);
      onUpdate?.();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert('Error al cambiar el estado del empleado');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isUpdating) return;
    if (!confirm(`¿Desactivar a ${user.nombre}?`)) return;
    setIsUpdating(true);
    try {
      await removeEmployee(employee.id_empleado);
      setIsMenuOpen(false);
      onUpdate?.();
    } catch (err) {
      console.error('Error al desactivar empleado:', err);
      alert('Error al desactivar el empleado');
    } finally {
      setIsUpdating(false);
    }
  };

  const initials = (user.nombre || user.correo_electronico || 'EM')
    .split(' ')
    .map(n => n && n[0] ? n[0] : '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'EM';

  const isActive = employee.estado === 'activo';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (view === 'list') {
    return (
      <div 
        className='flex items-center gap-4 p-4 rounded-xl transition-all'
        style={{ 
          background: 'var(--pos-bg-white)', 
          border: '1px solid var(--pos-border-soft)',
          opacity: isActive ? 1 : 0.6
        }}
      >
        {/* Avatar */}
        <div 
          className='w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0'
          style={{ background: isActive ? 'var(--fc-brand-600)' : '#999' }}
        >
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.nombre} className='w-full h-full rounded-full object-cover' />
          ) : (
            initials
          )}
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <h3 className='font-bold text-base truncate'>{user.nombre}</h3>
            <span 
              className='px-2 py-0.5 rounded text-xs font-semibold'
              style={{ 
                background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                color: isActive ? '#16a34a' : '#6b7280'
              }}
            >
              {employee.estado}
            </span>
          </div>
          <div className='text-sm opacity-70 truncate'>{user.correo_electronico}</div>
          <div className='text-xs opacity-50 mt-0.5'>Desde {formatDate(employee.fecha_alta)}</div>
        </div>

        {/* Actions */}
        <div className='relative flex-shrink-0'>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors'
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
            </svg>
          </button>

          {isMenuOpen && (
            <>
              <div className='fixed inset-0 z-40' onClick={() => setIsMenuOpen(false)} />
              <div 
                className='absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl z-50 overflow-hidden'
                style={{ background: 'var(--pos-bg-white)', border: '1px solid var(--pos-border-soft)' }}
              >
                <button
                  onClick={handleToggleStatus}
                  disabled={isUpdating}
                  className='w-full px-4 py-2.5 text-left text-sm hover:bg-black/5 transition-colors disabled:opacity-50'
                >
                  {isActive ? 'Desactivar' : 'Activar'}
                </button>
                {isActive && (
                  <button
                    onClick={handleRemove}
                    disabled={isUpdating}
                    className='w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50'
                  >
                    Eliminar acceso
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div 
      className='p-4 rounded-xl transition-all hover:shadow-md'
      style={{ 
        background: 'var(--pos-bg-white)', 
        border: '1px solid var(--pos-border-soft)',
        opacity: isActive ? 1 : 0.6
      }}
    >
      <div className='flex items-start justify-between mb-3'>
        <div 
          className='w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg'
          style={{ background: isActive ? 'var(--fc-brand-600)' : '#999' }}
        >
          {employee.usuario.avatar_url ? (
            <img src={user.avatar_url} alt={user.nombre} className='w-full h-full rounded-full object-cover' />
          ) : (
            initials
          )}
        </div>

        <div className='relative'>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors'
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
            </svg>
          </button>

          {isMenuOpen && (
            <>
              <div className='fixed inset-0 z-40' onClick={() => setIsMenuOpen(false)} />
              <div 
                className='absolute right-0 top-full mt-1 w-48 rounded-lg shadow-xl z-50 overflow-hidden'
                style={{ background: 'var(--pos-bg-white)', border: '1px solid var(--pos-border-soft)' }}
              >
                <button
                  onClick={handleToggleStatus}
                  disabled={isUpdating}
                  className='w-full px-4 py-2.5 text-left text-sm hover:bg-black/5 transition-colors disabled:opacity-50'
                >
                  {isActive ? 'Desactivar' : 'Activar'}
                </button>
                {isActive && (
                  <button
                    onClick={handleRemove}
                    disabled={isUpdating}
                    className='w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50'
                  >
                    Eliminar acceso
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className='space-y-1.5'>
        <div className='flex items-center gap-2'>
          <h3 className='font-bold text-base truncate'>{user.nombre}</h3>
        </div>
        <div className='text-sm opacity-70 truncate'>{user.correo_electronico}</div>
        {user.numero_telefono && (
          <div className='text-xs opacity-50'>{user.numero_telefono}</div>
        )}
      </div>

      <div className='mt-3 pt-3 border-t flex items-center justify-between' style={{ borderColor: 'var(--pos-border-soft)' }}>
        <div className='text-xs opacity-50'>Desde {formatDate(employee.fecha_alta)}</div>
        <span 
          className='px-2 py-1 rounded text-xs font-semibold'
          style={{ 
            background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.15)',
            color: isActive ? '#16a34a' : '#6b7280'
          }}
        >
          {employee.estado}
        </span>
      </div>
    </div>
  );
}
