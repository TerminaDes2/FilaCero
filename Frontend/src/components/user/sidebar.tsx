// app/user/sidebar.tsx
"use client";
import { useState } from 'react';
import { UserInfo } from '../../lib/api';
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  Shield,
  HelpCircle,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useUserStore } from '../../state/userStore';
import { useRouter } from 'next/navigation';

interface UserSidebarProps {
  user: UserInfo;
}

const getRoleInfo = (id_rol: number) => {
  switch (id_rol) {
    case 2:
      return {
        text: "Administrador",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        iconColor: "text-red-500"
      };
    case 4:
      return {
        text: "Usuario",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        iconColor: "text-blue-500"
      };
    default:
      return {
        text: "Usuario",
        color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
        iconColor: "text-gray-500"
      };
  }
};

const menuItems = [
  { id: 'profile', label: 'Mi Perfil', icon: User, active: true },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'verification', label: 'Verificación', icon: Shield },
  { id: 'help', label: 'Ayuda', icon: HelpCircle },
];

export default function UserSidebar({ user }: UserSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('profile');
  const { logout } = useUserStore();
  const router = useRouter();

  const roleInfo = getRoleInfo(user.id_rol);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-slate-800 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header del sidebar */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                  <User className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold ${roleInfo.color}`}>
                  {user.id_rol === 2 ? "A" : "U"}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.nombre}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.correo_electronico}
                </p>
                <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${roleInfo.color}`}>
                  {roleInfo.text}
                </span>
              </div>
            </div>
          </div>

          {/* Menú de navegación */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer del sidebar */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}