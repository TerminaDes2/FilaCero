import React from 'react';
import '../globals.css';

export const metadata = {
  title: 'Autenticación | FilaCero',
  description: 'Accede a tu cuenta de FilaCero o crea una nueva.'
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative bg-white dark:bg-slate-950">
      {/* Background decorative layers */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 25%, rgba(233,74,111,0.18), transparent 60%), radial-gradient(circle at 80% 30%, rgba(76,193,173,0.15), transparent 65%), radial-gradient(circle at 50% 80%, rgba(233,74,111,0.12), transparent 70%)' }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.12) 1px, transparent 0)', backgroundSize: '20px 20px' }} />

      <main className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-500 dark:text-slate-400 relative z-10">
        © {new Date().getFullYear()} Fila<span style={{color:'#D55D7B'}}>Cero</span>
      </footer>
    </div>
  );
}
