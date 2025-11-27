import React from 'react';
import '../globals.css';

export const metadata = {
  title: 'Autenticación | FilaCero',
  description: 'Accede a tu cuenta de FilaCero o crea una nueva.'
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-neutral-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <main className="relative z-10 flex flex-1 w-full items-center justify-center px-4">
        <div className="w-full">
          {children}
        </div>
      </main>
      {/* <footer className="py-6 text-center text-xs text-gray-500 relative z-10">
        © {new Date().getFullYear()} Fila<span style={{color:'#D55D7B'}}>Cero</span>
      </footer> */}
    </div>
  );
}
