"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUserStore } from "../../state/userStore";
import { usePathname, useRouter } from "next/navigation";
import { Store, Home, Bell } from "lucide-react";
import UserDropdown from "../UserDropdown";
import { useCart } from "./CartContext"; // 👈 se importa el carrito

interface NavbarStoreProps {
  onToggleCart?: (open: boolean) => void;
}

export default function NavbarStore({ onToggleCart }: NavbarStoreProps) {
  const [scrolled, setScrolled] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const { isAuthenticated, loading } = useUserStore();
  const { open, toggleOpen, items } = useCart(); // 👈 contexto del carrito
  const router = useRouter();

  const [notifications] = useState([
    {
      id: 1,
      title: "Nueva promoción 🎉",
      description: "Aprovecha 2x1 en productos seleccionados hasta el 25 de octubre.",
      date: "22/10/2025",
      time: "14:35",
    },
  ]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleGoHome = () => router.push("/");

  const handleToggleCart = () => {
    toggleOpen(true);
    setOpenNotifications(false); // 👈 cierra notificaciones si el carrito se abre
  };

  const handleToggleNotifications = () => {
    setOpenNotifications(!openNotifications);
    toggleOpen(false); // 👈 cierra carrito si se abren notificaciones
  };

  if (loading) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl ${
        scrolled ? "bg-white/90 dark:bg-slate-900/90 shadow-lg" : "bg-white/70"
      } border-b border-gray-200 dark:border-slate-700 transition`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
            <Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
            <span className="text-[2rem] font-extrabold select-none">
              <span style={{ color: "var(--fc-brand-600)" }}>Fila</span>
              <span style={{ color: "var(--fc-teal-500)" }}>Cero</span>
            </span>
          </Link>
          <div className="h-6 w-px bg-gray-300 dark:bg-slate-600"></div>
          <span className="text-sm font-medium text-gray-600 dark:text-slate-300 flex items-center gap-1">
            <Store className="w-4 h-4" />
            Tienda
          </span>
        </div>

        {/* Botón Inicio */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <Home className="w-4 h-4" />
            Volver al Inicio
          </button>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center gap-4 relative">
          {/* 🔔 Notificaciones */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={handleToggleNotifications}
                className="border-2 border-green-500 rounded-full p-2 hover:bg-green-50 transition flex items-center justify-center"
              >
                <Bell
                  className={`w-5 h-5 transition-all ${
                    openNotifications ? "fill-green-600 text-green-600" : "text-green-600"
                  }`}
                />
              </button>

              {openNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden animate-fadeIn z-50">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Notificaciones</h3>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div key={n.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition">
                          <h4 className="font-medium text-gray-900">{n.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{n.description}</p>
                          <span className="text-xs text-gray-400 block mt-2">
                            {n.date} • {n.time}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 flex flex-col items-center justify-center text-gray-400">
                        <img src="https://via.placeholder.com/120x120?text=📭" alt="Sin notificaciones" className="opacity-70 mb-2" />
                        <p className="text-sm font-medium">Aún no tienes notificaciones.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🛒 Carrito */}
          {isAuthenticated && (
            <button
              className="relative flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full transition-colors"
              onClick={handleToggleCart}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-pink-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {items.length}
                </span>
              )}
            </button>
          )}

          {/* 👤 Usuario */}
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <div className="flex items-center gap-3">
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 53b96940f7f20f9c5ba16fab7430fea9dcad3b18
              <Link
                href="/login"
                className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300/70 dark:border-white/15 text-gray-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-300 transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 transition shadow-glow"
              >
<<<<<<< HEAD
=======
              <Link href="/auth/login" className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-brand-500 hover:text-brand-600 transition">
                Iniciar sesión
              </Link>
              <Link href="/auth/register" className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 transition shadow-glow">
>>>>>>> 4338d8850fee87186cc5d22c785207f090563c40
=======
>>>>>>> 53b96940f7f20f9c5ba16fab7430fea9dcad3b18
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </nav>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </header>
  );
}
