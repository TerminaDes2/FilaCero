// Quitado: import '../globals.css'; // Ya se importa en el layout raíz
// Quitado: import { Inter } from 'next/font/google'; // Ya se usa en el layout raíz
// Quitado: import type { Metadata } from 'next'; // La metadata va en el layout raíz o en la página
import React from 'react';
import { ShortcutProvider } from '../../src/components/system/ShortcutProvider'; // Mantenemos este provider

// Quitado: const inter = Inter({ subsets: ['latin'] });
// Quitado: export const metadata: Metadata = { ... };

// Cambiado el nombre de RootLayout a PosLayout para claridad
export default function PosLayout({ children }: { children: React.ReactNode }) {
  // Quitadas las etiquetas <html> y <body>
  return (
    // Mantenemos el ShortcutProvider si es necesario para esta sección
    <ShortcutProvider>
      {children}
    </ShortcutProvider>
  );
}