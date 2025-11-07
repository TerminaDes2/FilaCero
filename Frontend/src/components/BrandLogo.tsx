"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  withWordmark?: boolean; // show FilaCero text
  className?: string;
  size?: number; // base size for icon
  asLink?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ withWordmark = true, className = '', size = 36, asLink }) => {
  const logo = (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image 
        src="/LogoFilaCero.svg" 
        alt="FilaCero" 
        width={size} 
        height={size} 
        className="drop-shadow-sm"
        style={{ height: 'auto', width: 'auto', maxHeight: size, maxWidth: size }}
      />
      {withWordmark && (
        <span className="hidden sm:inline text-[2rem] font-extrabold leading-none select-none">
          <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
          <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
        </span>
      )}
    </div>
  );
  
  if (asLink) {
    return (
      <Link 
        href="/" 
        aria-label="Inicio - FilaCero" 
        className="inline-flex hover:opacity-80 transition-opacity"
      >
        {logo}
      </Link>
    );
  }
  
  return logo;
};