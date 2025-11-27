import React from 'react';
import '../globals.css';

export const metadata = {
  title: 'Autenticación | FilaCero',
  description: 'Accede a tu cuenta de FilaCero o crea una nueva.'
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="min-h-screen flex flex-col relative bg-white">
      <main className="flex-1 flex items-center justify-center px-4 z-10">
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
