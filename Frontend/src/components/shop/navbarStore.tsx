// components/navbarStore.tsx - NAVBAR ESPECIAL PARA TIENDA
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUserStore } from "../../state/userStore";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { 
  User, 
  LogOut, 
  Store, 
  LayoutDashboard, 
  ChevronDown,
  Settings,
  CreditCard,
  Home,
  ShoppingCart,
  Package
} from "lucide-react";

// Función para obtener color y texto del rol
const getRoleInfo = (id_rol: number) => {
  switch (id_rol) {
    case 2:
      return {
        text: "Admin",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        borderColor: "border-red-200 dark:border-red-700"
      };
    case 4:
      return {
        text: "Usuario",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        borderColor: "border-blue-200 dark:border-blue-700"
      };
    default:
      return {
        text: "Usuario",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        borderColor: "border-gray-200 dark:border-gray-700"
      };
  }
};

export default function NavbarStore() {
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { open, toggleOpen, total, items } = useCart();
  
  const { user, isAuthenticated, logout, loading } = useUserStore();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu-trigger') && !target.closest('.user-menu-content')) {
        setUserMenuOpen(false);
      }
    };
    
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push('/');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 shadow-lg border-b border-gray-200 dark:border-slate-700">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
            <span className="text-[2rem] font-extrabold select-none">
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span><span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </span>
            <span className="text-sm font-medium text-gray-500 ml-2">Tienda</span>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 shadow-lg border-b border-gray-200 dark:border-slate-700"
      role="banner"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main">
        {/* Logo y título de la tienda */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
            <Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
            <span className="text-[2rem] font-extrabold select-none">
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span><span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </span>
          </Link>
          <div className="h-6 w-px bg-gray-300 dark:bg-slate-600"></div>
          <span className="text-sm font-medium text-gray-600 dark:text-slate-300 flex items-center gap-1">
            <Store className="w-4 h-4" />
            Tienda
          </span>
        </div>
        
        {/* Navegación central - Solo botón Inicio */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <Home className="w-4 h-4" />
            Volver al Inicio
          </button>
        </div>
        
        {/* Lado derecho - Menú de usuario */}
        <div className="flex items-center gap-4">
          
          {/* Botón del carrito rosa */}
                <button 
                    className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full transition-colors"
                    onClick={() => toggleOpen(true)}
                    aria-expanded={open}
                >
                    {/* Icono del carrito */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="10" cy="20" r="1" />
                    <circle cx="18" cy="20" r="1" />
                    </svg>
                    
                    {/* Número de items */}
                    {items.length > 0 && (
                    <span className="bg-white text-pink-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        {items.length}
                    </span>
                    )}
                </button>        
          {isAuthenticated && user ? (
            // 👇 MENÚ DE USUARIO AUTENTICADO
            <div className="relative">
              <button
                className="user-menu-trigger flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen(!userMenuOpen);
                }}
              >
                {/* Avatar con icono */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center border-2 border-brand-200 dark:border-brand-800">
                    <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  {/* Badge del rol */}
                  {user.id_rol && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold ${getRoleInfo(user.id_rol).color} ${getRoleInfo(user.id_rol).borderColor}`}>
                      {user.id_rol === 2 ? "A" : "U"}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-200 max-w-[120px] truncate">
                    {user.nombre.split(' ')[0]}
                  </span>
                  {user.id_rol && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleInfo(user.id_rol).color} ${getRoleInfo(user.id_rol).borderColor}`}>
                      {getRoleInfo(user.id_rol).text}
                    </span>
                  )}
                </div>
                
                <ChevronDown 
                  className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>
                      
              {/* Menú desplegable */}
              {userMenuOpen && (
                <div className="user-menu-content absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-2 z-50">
                  {/* Header del usuario */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center border-2 border-brand-200 dark:border-brand-800">
                          <User className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                        </div>
                        {user.id_rol && (
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold ${getRoleInfo(user.id_rol).color} ${getRoleInfo(user.id_rol).borderColor}`}>
                            {user.id_rol === 2 ? "A" : "U"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.nombre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                          {user.correo_electronico}
                        </p>
                        {user.id_rol && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className={`w-2 h-2 rounded-full ${user.id_rol === 2 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <span className={`text-xs font-medium ${getRoleInfo(user.id_rol).color} px-2 py-0.5 rounded-full`}>
                              {getRoleInfo(user.id_rol).text}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Opciones del menú */}
                  <div className="py-2">
                    {user.id_rol === 2 && (
                      <Link 
                        href="/pos" 
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                        <span>Panel Administrador</span>
                      </Link>
                    )}
                    
                    
                    <Link 
                      href="" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                      <span>Configuración</span>
                    </Link>
                  </div>
                  
                  {/* Separador */}
                  <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                  
                  {/* Cerrar sesión */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            // 👇 BOTONES DE LOGIN/REGISTER (solo si no está autenticado)
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300/70 dark:border-white/15 text-gray-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-300 transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 transition shadow-glow"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}