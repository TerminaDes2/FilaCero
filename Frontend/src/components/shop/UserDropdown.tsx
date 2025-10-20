// components/UserDropdown.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../state/userStore";
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  ChevronDown,
  Settings
} from "lucide-react";

// Función para obtener color y texto del rol (mover aquí también)
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

export default function UserDropdown() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useUserStore();
  const router = useRouter();

  // Cerrar menú al hacer click fuera
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

  if (!user) return null;

  const roleInfo = getRoleInfo(user.id_rol);

  return (
    <div className="relative">
      console.log("Usuario: " user.id_rol);
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
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold ${roleInfo.color} ${roleInfo.borderColor}`}>
              {user.id_rol === 2 ? "A" : "U"}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200 max-w-[120px] truncate">
            {user.nombre.split(' ')[0]}
          </span>
          {user.id_rol && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${roleInfo.color} ${roleInfo.borderColor}`}>
              {roleInfo.text}
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
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold ${roleInfo.color} ${roleInfo.borderColor}`}>
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
                    <span className={`text-xs font-medium ${roleInfo.color} px-2 py-0.5 rounded-full`}>
                      {roleInfo.text}
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
              href="/user" 
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
              onClick={() => setUserMenuOpen(false)}
            >
              <Settings className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span>Mi Perfil</span>
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
  );
}