import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative bg-slate-950 text-slate-300 pt-16 pb-10" role="contentinfo">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-600/60 to-transparent" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4 mb-12">
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">FilaCero</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Plataforma para administrar productos, inventario y ventas en cafeterías escolares de forma ágil.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">PRODUCTO</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-brand-300">Características</a></li>
              <li><a href="#pricing" className="hover:text-brand-300">Precios</a></li>
              <li><a href="#process" className="hover:text-brand-300">Cómo funciona</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">RECURSOS</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/productos" className="hover:text-brand-300">Panel</Link></li>
              <li><a href="#cta" className="hover:text-brand-300">Empezar</a></li>
              <li><a href="#testimonials" className="hover:text-brand-300">Testimonios</a></li>
              <li><Link href="/auth/login" className="hover:text-brand-300">Iniciar sesión</Link></li>
              <li><Link href="/auth/register" className="hover:text-brand-300">Crear cuenta</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">LEGAL</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-300">Términos</a></li>
              <li><a href="#" className="hover:text-brand-300">Privacidad</a></li>
              <li><a href="#" className="hover:text-brand-300">Contacto</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© {year} FilaCero. Todos los derechos reservados.</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <a href="#" className="hover:text-brand-300">Soporte</a>
            <a href="#" className="hover:text-brand-300">Estado</a>
            <a href="#" className="hover:text-brand-300">Roadmap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
