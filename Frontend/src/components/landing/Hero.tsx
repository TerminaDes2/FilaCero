import Image from "next/image";
import Link from "next/link";
import { Reveal } from "../../components/Reveal";
import BackgroundSquares from "./BackgroundSquares";

export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative min-h-screen md:min-h-[100dvh] pt-32 md:pt-40 pb-20 flex items-center overflow-hidden bg-app-gradient"
    >
      {/* Background rotated squares within hero */}
      <BackgroundSquares />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <Reveal className="space-y-7" >
            <h1 id="hero-heading" className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Plataforma POS + tienda en linea <span className="text-gradient">cafeterías escolares</span>.
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Reduce filas y atiende más pedidos en cada receso. Sin apps nativas, sin hardware propietario, listo en minutos.
            </p>
            {/* Social proof inline */}
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="inline-flex -space-x-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 border border-white" aria-hidden="true" />
                <span className="w-6 h-6 rounded-full bg-amber-400 border border-white" aria-hidden="true" />
                <span className="w-6 h-6 rounded-full bg-teal-500 border border-white" aria-hidden="true" />
              </span>
              <span className="text-xs sm:text-sm">Escuelas piloto ya operando sin filas</span>
            </p>
            {/* Metrics semantic list */}
            <ul className="flex flex-wrap gap-2 pt-1" aria-label="Indicadores clave">
              {[
                { label: "< 5s orden", desc: "flujo optimizado" },
                { label: "100% responsive", desc: "móvil primero" },
                { label: "Sin descargas", desc: "solo escanear" }
              ].map(item => (
                <li key={item.label} className="group relative rounded-full px-4 py-1.5 bg-white/70 backdrop-blur border border-white/60 text-[11px] font-medium text-gray-700 flex items-center gap-2 shadow-sm">
                  <span className="text-brand-600" aria-hidden="true">●</span>
                  <span>{item.label}</span>
                  <span className="sr-only">{item.desc}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4 items-center">
              <Link href="/register" className="group relative inline-flex items-center gap-2 bg-brand-600 text-white px-7 py-3 rounded-full font-semibold shadow-glow hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 transition">
                <span>Crear cuenta gratis</span>
                <span className="translate-x-0 group-hover:translate-x-1 transition" aria-hidden="true">→</span>
              </Link>
              <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border border-gray-300/70 text-gray-700 hover:border-brand-500 hover:text-brand-600 dark:text-gray-200 dark:border-white/15 dark:hover:border-brand-400 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 transition">
                Compra ahora
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-brand-600 hover:underline">
                Planes
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 pt-2">
              <ul className="text-sm text-gray-600 space-y-1" aria-label="Ventajas principales">
                <li className="flex items-start gap-2"><span className="text-brand-600" aria-hidden="true">✔</span><span>Implementación sin fricción</span></li>
                <li className="flex items-start gap-2"><span className="text-brand-600" aria-hidden="true">✔</span><span>Funciona en cualquier dispositivo</span></li>
                <li className="flex items-start gap-2"><span className="text-brand-600" aria-hidden="true">✔</span><span>Optimizado para recreos cortos</span></li>
              </ul>
              <p className="text-xs text-gray-500 max-w-xs">
                <strong className="font-semibold text-gray-700">Sin tarjeta</strong> en el inicio. Migra a módulos avanzados cuando lo necesites.
              </p>
            </div>
            <p className="text-sm text-gray-600 pt-1">
              ¿Ya tienes cuenta? <Link href="/login" className="font-medium text-brand-600 hover:underline">Inicia sesión</Link>
            </p>
          </Reveal>
          <Reveal delay={120} className="relative">
            <div className="absolute -inset-4 bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60" />
            <div className="relative rounded-3xl p-5 bg-white shadow-xl border border-white/70 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-brand-400 to-brand-600 opacity-20 rounded-full blur-2xl animate-float-slow" />
              <Image 
                src="/images/POS-OrdenarMenu.png" 
                width={900} 
                height={620} 
                priority
                alt="Vista previa del POS FilaCero mostrando la pantalla de ordenar" 
                className="w-full h-auto relative rounded-xl border border-white/40 shadow-sm" 
              />
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                {["Inventario","Ventas","Reportes"].map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-brand-50 text-brand-700 font-medium text-center">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
