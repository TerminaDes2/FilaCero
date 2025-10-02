import React from 'react';

interface BackButtonProps {
  onBackToSelection: () => void;
}

export function BackButton({ onBackToSelection }: BackButtonProps) {
  return (
    <button
      onClick={onBackToSelection}
      className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 bg-white/80 hover:bg-white backdrop-blur-sm rounded-lg border border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md"
      aria-label="Volver a la selección de tipo de cuenta"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span className="text-sm font-medium">Volver</span>
    </button>
  );
}