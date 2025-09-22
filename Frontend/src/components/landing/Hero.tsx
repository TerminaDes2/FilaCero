import Image from "next/image";
import Link from "next/link";
import { Reveal } from "../../components/Reveal";
import BackgroundSquares from "./BackgroundSquares";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen md:min-h-[100dvh] pt-32 md:pt-40 pb-20 flex items-center overflow-hidden bg-app-gradient"
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        {/* Main soft halo */}
        <div className="absolute top-[-18rem] left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full bg-gradient-to-br from-brand-100 via-brand-200 to-brand-300 opacity-40 blur-3xl animate-pulse" />
        {/* Left ambient blob */}
        <div className="absolute -bottom-40 -left-24 w-[30rem] h-[30rem] rounded-full bg-gradient-to-tr from-brand-50 via-brand-200/70 to-brand-400/0 opacity-50 blur-3xl animate-blob" />
        {/* Right accent blob */}
        <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-brand-200 via-brand-500/40 to-brand-700/10 opacity-40 blur-3xl animate-blob" />
      </div>
      {/* Background rotated squares within hero */}
      <BackgroundSquares />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <Reveal className="space-y-7" >
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Sin filas, sin prisas. Tus órdenes <span className="text-gradient">en segundos</span>.
            </h1>
            <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Escanea el código, realiza el pedido y recoge. Gestión moderna de pedidos para puntos de venta con foco en velocidad.
            </p>
            {/* Quick metrics */}
            <div className="flex flex-wrap gap-3 pt-1">
              {[
                { label: "< 5s por orden", desc: "flujo optimizado" },
                { label: "100% responsive", desc: "móvil primero" },
                { label: "Sin descargas", desc: "solo escanear" }
              ].map(item => (
                <div key={item.label} className="group relative rounded-full px-4 py-1.5 bg-white/70 dark:bg-white/5 backdrop-blur border border-white/60 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-slate-200 flex items-center gap-2 shadow-sm">
                  <span className="text-brand-600">●</span>
                  <span>{item.label}</span>
                  <span className="sr-only">{item.desc}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="#cta" className="group relative inline-flex items-center gap-2 bg-brand-600 text-white px-7 py-3 rounded-full font-semibold shadow-glow hover:bg-brand-500 transition">
                <span>Probar ahora</span>
                <span className="translate-x-0 group-hover:translate-x-1 transition">→</span>
              </Link>
              <Link href="#features" className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold border border-gray-300/70 text-gray-700 hover:border-brand-500 hover:text-brand-600 dark:text-gray-200 dark:border-white/15 dark:hover:border-brand-400 dark:hover:text-brand-300 transition">
                Ver características
              </Link>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 pt-1">
              ¿Ya tienes cuenta? <Link href="/auth/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">Inicia sesión</Link>
            </p>
            <ul className="mt-5 text-sm text-gray-600 dark:text-slate-400 space-y-2">
              <li className="flex items-start gap-2"><span className="text-brand-600" aria-hidden="true">✔</span><span>Implementación sin fricción</span></li>
              <li className="flex items-start gap-2"><span className="text-brand-600" aria-hidden="true">✔</span><span>Funciona en cualquier dispositivo</span></li>
              <li className="flex items-start gap-2"><span className="text-brand-600" aria-hidden="true">✔</span><span>Velocidad y simplicidad primero</span></li>
            </ul>
          </Reveal>
          <Reveal delay={120} className="relative">
            <div className="absolute -inset-4 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10" />
            <div className="relative rounded-3xl p-5 bg-white dark:bg-slate-900/60 shadow-xl border border-white/70 dark:border-white/10 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-brand-400 to-brand-600 opacity-20 rounded-full blur-2xl animate-float-slow" />
              <Image 
                src="/images/POS-OrdenarMenu.png" 
                width={900} 
                height={620} 
                priority
                alt="Vista previa del POS FilaCero mostrando la pantalla de ordenar" 
                className="w-full h-auto relative rounded-xl border border-white/40 dark:border-white/10 shadow-sm" 
              />
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                {["Inventario","Ventas","Reportes"].map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-brand-50 text-brand-700 font-medium dark:bg-brand-500/20 dark:text-brand-200 text-center">
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
