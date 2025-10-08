import React from 'react';
import { useCart } from './CartContext';

export default function Header() {
  const { open, toggleOpen, total, items } = useCart();

  return (
    <header className="w-full border-b" style={{ borderColor: 'var(--fc-border-soft)' }}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Lado izquierdo - Solo tiendas */}
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 items-center">
            <a className="text-sm font-medium text-gray-700 hover:underline">Tiendas</a>
          </nav>
        </div>

        {/* Lado derecho - Carrito y usuario */}
        <div className="flex items-center gap-4">
          {/* Botón de carrito rosa */}
          <button 
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full transition-colors"
            onClick={() => toggleOpen(true)}
            aria-expanded={open}
          >
            {/* Icono del carrito */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            
            {/* Número de items */}
            {items.length > 0 && (
              <span className="bg-white text-pink-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {items.length}
              </span>
            )}
          </button>

          {/* Botones de usuario */}
          <div className="flex items-center gap-2">
            <button className="text-sm text-gray-700 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition-colors">
              Iniciar sesión
            </button>
            <button className="text-sm bg-gray-900 text-white hover:bg-gray-800 px-3 py-1 rounded transition-colors">
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 