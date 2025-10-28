"use client";
import React, { useState } from 'react';
import { useEmployeesStore } from '../../../pos/employeesStore';

interface NewEmployeePanelProps {
  businessId: string;
  onClose: () => void;
  onEmployeeCreated?: () => void;
}

export function NewEmployeePanel({ businessId, onClose, onEmployeeCreated }: NewEmployeePanelProps) {
  const { addEmployee } = useEmployeesStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addEmployee(businessId, email, name || undefined);
      setSuccess(true);
      
      // Mostrar mensaje de éxito y cerrar
      setTimeout(() => {
        onEmployeeCreated?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error al agregar empleado:', err);
      setError(err.message || 'Error al agregar el empleado');
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
      {/* Overlay */}
      <div 
        className='fixed inset-0 bg-black/40 z-50 animate-fadeIn'
        onClick={handleClose}
      />

      {/* Panel */}
      <div 
        className='fixed right-0 top-0 bottom-0 w-full sm:w-[480px] z-50 shadow-2xl animate-slideInRight flex flex-col'
        style={{ background: 'var(--pos-bg-sand)' }}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b' style={{ borderColor: 'var(--pos-border-soft)' }}>
          <div>
            <h2 className='text-2xl font-bold'>Agregar Empleado</h2>
            <p className='text-sm opacity-70 mt-1'>Invita a un nuevo miembro al equipo</p>
          </div>
          <button 
            onClick={handleClose}
            disabled={isSubmitting}
            className='w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors disabled:opacity-50'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6 custom-scroll-area'>
          {success ? (
            <div className='flex flex-col items-center justify-center py-12 gap-4'>
              <div 
                className='w-20 h-20 rounded-full flex items-center justify-center animate-scaleIn'
                style={{ background: 'rgba(34, 197, 94, 0.15)' }}
              >
                <svg className='w-10 h-10 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
              </div>
              <div className='text-center'>
                <h3 className='text-xl font-bold mb-2'>¡Empleado agregado!</h3>
                <p className='text-sm opacity-70'>Se ha enviado una invitación por correo</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Info box */}
              <div className='p-4 rounded-lg' style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div className='flex gap-3'>
                  <svg className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                  </svg>
                  <div className='text-sm'>
                    <p className='font-semibold mb-1 text-blue-900'>Invitación automática</p>
                    <p className='text-blue-800 opacity-80 text-xs'>Si el correo no está registrado, se creará una cuenta automáticamente y se enviará un correo de invitación para configurar la contraseña.</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className='block text-sm font-semibold mb-2'>
                  Correo electrónico <span className='text-red-500'>*</span>
                </label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='empleado@ejemplo.com'
                  disabled={isSubmitting}
                  className='w-full px-4 py-3 rounded-lg text-base transition-all focus:outline-none focus:ring-2 disabled:opacity-50'
                  style={{ 
                    background: 'var(--pos-bg-white)', 
                    border: '1px solid var(--pos-border-soft)',
                    '--tw-ring-color': 'var(--fc-brand-500)'
                  } as any}
                  required
                />
              </div>

              {/* Name (optional) */}
              <div>
                <label className='block text-sm font-semibold mb-2'>
                  Nombre completo <span className='text-xs opacity-60'>(opcional)</span>
                </label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Juan Pérez'
                  disabled={isSubmitting}
                  className='w-full px-4 py-3 rounded-lg text-base transition-all focus:outline-none focus:ring-2 disabled:opacity-50'
                  style={{ 
                    background: 'var(--pos-bg-white)', 
                    border: '1px solid var(--pos-border-soft)',
                    '--tw-ring-color': 'var(--fc-brand-500)'
                  } as any}
                />
                <p className='text-xs opacity-60 mt-1.5'>Si no se proporciona, se usará la primera parte del correo</p>
              </div>

              {/* Error message */}
              {error && (
                <div className='p-3 rounded-lg' style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <p className='text-sm text-red-700'>{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className='flex gap-3 pt-4'>
                <button
                  type='button'
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className='flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:bg-black/5 disabled:opacity-50'
                  style={{ border: '1px solid var(--pos-border-soft)' }}
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  disabled={isSubmitting || !email.trim()}
                  className='flex-1 px-4 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50'
                  style={{ background: 'var(--pos-accent-green)' }}
                >
                  {isSubmitting ? 'Agregando...' : 'Agregar empleado'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </>
  );
}
