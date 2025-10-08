"use client";
import React, { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

interface ShortcutsHelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const ShortcutsHelpOverlay: React.FC<ShortcutsHelpOverlayProps> = ({ open, onClose }) => {
  const pathname = usePathname() || '';
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const items = useMemo(() => {
    const base: Array<[string, string]> = [
      ['Ctrl/Cmd + K', 'Enfocar búsqueda'],
      ['/', 'Enfocar búsqueda'],
      ['V', 'Alternar vista (grid/list)'],
      ['P', 'Ir a inicio POS'],
      ['S', 'Ir a configuración'],
      ['Ctrl/Cmd + L', 'Cerrar sesión'],
      ['Enter', 'Confirmar en diálogos / Guardar en paneles'],
      ['Escape', 'Cancelar/Cerrar diálogo o panel'],
      ['?', 'Abrir esta ayuda'],
    ];
    if (pathname.startsWith('/pos/products')) {
      base.splice(3, 0, ['N', 'Nuevo producto (admin productos)']);
    }
    return base;
  }, [pathname]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal>
      <button aria-label='Cerrar ayuda de atajos' onClick={onClose} className='absolute inset-0 bg-black/40 cursor-default' />
      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div className='w-full max-w-lg rounded-2xl shadow-xl ring-1 p-5' style={{ background: 'var(--pos-card-bg)', borderColor: 'var(--pos-card-border)' }}>
          <div className='flex items-start justify-between gap-3 mb-2'>
            <h2 className='text-lg font-extrabold' style={{ color: 'var(--pos-text-heading)' }}>Atajos de teclado</h2>
            <button onClick={onClose} className='w-8 h-8 rounded-full text-white' style={{ background: 'var(--pos-accent-green)' }}>✕</button>
          </div>
          <p className='text-sm mb-4' style={{ color: 'var(--pos-text-muted)' }}>Mejora tu velocidad con estos atajos. Presiona Escape para cerrar.</p>
          <ul className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
            {items.map(([k, desc]) => (
              <li key={k} className='flex items-start gap-3'>
                <span className='px-2 py-1 rounded-md text-[11px] font-semibold' style={{ background: 'var(--pos-badge-stock-bg)', color: 'var(--pos-chip-text)' }}>{k}</span>
                <span style={{ color: 'var(--pos-text-heading)' }}>{desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelpOverlay;
