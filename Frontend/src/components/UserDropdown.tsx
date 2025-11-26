// components/UserDropdown.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { useBusinessStore } from "../state/businessStore";
import { BusinessPickerDialog } from "./business/BusinessPickerDialog";
import type { Business } from "./business/BusinessPickerDialog";
import { useRouter } from "next/navigation";
import { useUserStore } from "../state/userStore";
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  ChevronDown,
  Settings,
  Store
} from "lucide-react";

// Función robusta para obtener el id_rol como número
const getRoleId = (id_rol: any): number => {
  const roleId = Number(id_rol);
  return isNaN(roleId) ? 4 : roleId;
};

// Función para obtener color y texto del rol
const getRoleInfo = (id_rol: any) => {
  const roleId = getRoleId(id_rol);
  
  switch (roleId) {
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
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const [showBizPicker, setShowBizPicker] = useState(false);
  const [bizList, setBizList] = useState<any[]>([]);
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

  const roleId = getRoleId(user.id_rol);
  const roleInfo = getRoleInfo(roleId);
  const shouldShowAdminPanel = roleId === 2;

  return (
    <div className="relative">
      <button
        className="user-menu-trigger flex items-center gap-3 rounded-full border border-brand-100 bg-white/85 px-3.5 py-2 text-left shadow-sm transition hover:border-brand-200 hover:bg-brand-50/60"
        onClick={(e) => {
          e.stopPropagation();
          setUserMenuOpen(!userMenuOpen);
        }}
      >
        {/* Avatar con icono */}
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-brand-50 shadow-sm">
            <User className="w-5 h-5 text-brand-600" />
          </div>
          {/* Badge del rol */}
          <div className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-sm ${roleInfo.color} ${roleInfo.borderColor}`}>
            {roleId === 2 ? "A" : "U"}
          </div>
        </div>
        
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-brand-700 max-w-[140px] truncate">
            {user.nombre.split(' ')[0]}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${roleInfo.borderColor} bg-white/80 text-brand-600 shadow-sm`}>
            {roleInfo.text}
          </span>
        </div>
        
        <ChevronDown 
          className={`w-4 h-4 text-brand-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
        />
      </button>
              
      {/* Menú desplegable */}
      {userMenuOpen && (
        <div className="user-menu-content absolute right-0 top-full mt-3 w-72 z-50">
          <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-white text-slate-900 shadow-2xl shadow-brand-100/50">
            <div
              className="absolute inset-0"
              aria-hidden
              style={{
                background:
                  "radial-gradient(circle at 6% 0%, rgba(233,74,111,0.16), transparent 55%), radial-gradient(circle at 94% 0%, rgba(76,193,173,0.14), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.96) 100%)"
              }}
            />
            <div className="relative flex flex-col">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-brand-100/70">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-200 bg-brand-50 shadow-sm">
                    <User className="w-6 h-6 text-brand-600" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-bold shadow-sm ${roleInfo.color} ${roleInfo.borderColor}`}>
                    {roleId === 2 ? "A" : "U"}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.nombre}</p>
                  <p className="text-xs text-slate-500 truncate">{user.correo_electronico}</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600 shadow-sm">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                    Sesión activa • {roleInfo.text}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3">
                {shouldShowAdminPanel && (
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
                    onClick={async () => {
                      if (!activeBusiness) {
                        try {
                          const list = await api.listMyBusinesses();
                          setBizList(list || []);
                        } catch {
                          setBizList([]);
                        }
                        setShowBizPicker(true);
                        setUserMenuOpen(false);
                        return;
                      }
                      setUserMenuOpen(false);
                      router.push('/pos');
                    }}
                  >
                    <LayoutDashboard className="h-4 w-4 text-brand-500" />
                    <span>Ir al panel POS</span>
                  </button>
                )}

                {shouldShowAdminPanel && (
                  <button
                    type="button"
                    className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
                    onClick={async () => {
                      try {
                        const list = await api.listMyBusinesses();
                        setBizList(list || []);
                      } catch {
                        setBizList([]);
                      }
                      setShowBizPicker(true);
                      setUserMenuOpen(false);
                    }}
                  >
                    <Store className="h-4 w-4 text-brand-500" />
                    <span>Seleccionar negocio</span>
                  </button>
                )}

                <Link
                  href="/user"
                  className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-brand-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 text-brand-500" />
                  <span>Mi perfil</span>
                </Link>

                <Link
                  href="/shop"
                  className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-4 w-4 text-brand-500" />
                  <span>Ver tienda demo</span>
                </Link>
              </div>

              <div className="border-t border-brand-100/70 bg-brand-50/60 px-5 py-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-500/15"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBizPicker && (
        <BusinessPickerDialog
          open={showBizPicker}
          businesses={bizList}
          onChoose={(b: Business) => {
            setActiveBusiness(b);
            setShowBizPicker(false);
            router.push("/pos");
          }}
          onCreateNew={() => {
            setShowBizPicker(false);
            router.push("/onboarding/negocio");
          }}
          onClose={() => {
            setShowBizPicker(false);
          }}
        />
      )}
    </div>
  );
}