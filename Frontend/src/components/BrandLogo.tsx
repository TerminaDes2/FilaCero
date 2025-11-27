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
        <span className="hidden select-none text-[2rem] font-extrabold leading-none sm:inline">
          <span className="transition-colors duration-300 text-brand-600 dark:text-brand-200">Fila</span>
          <span className="transition-colors duration-300 text-teal-500 dark:text-teal-200">Cero</span>
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