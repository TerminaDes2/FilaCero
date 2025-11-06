// userStore.tsx - VERSIÓN COMPLETA
"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, type UserInfo } from '../lib/api';

export type AppRole = 'CUSTOMER' | 'OWNER' | null;
export type BackendRole = 'usuario' | 'admin' | string | null;

interface UserState {
  // Estado de autenticación
  user: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, userData: UserInfo) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  
  // Estado existente (mantener compatibilidad)
  role: AppRole;
  setRole: (r: AppRole) => void;
  name: string | null;
  setName: (n: string | null) => void;
  backendRole: BackendRole;
  setBackendRole: (r: BackendRole) => void;
  tempData: Record<string, unknown>;
  setTempData: (k: string, v: unknown) => void;
  reset: () => void;
}

const UserContext = createContext<UserState | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<AppRole>(null);
  const [name, setNameState] = useState<string | null>(null);
  const [backendRole, setBackendRoleState] = useState<BackendRole>(null);
  const [tempData, setTemp] = useState<Record<string, unknown>>({});

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!token) {
        // No hay token, no está autenticado
        setLoading(false);
        return;
      }
      
      // Verificar el token con el backend
      const userData = await api.me();
      setUser(userData);
      
      // Mapear rol por nombre (fallback a id numérico)
      const roleName = (userData as any).role_name || userData.role?.nombre_rol || null;
      const appRole = roleName === 'admin' || roleName === 'superadmin' || userData.id_rol === 2 ? 'OWNER' : 'CUSTOMER';
      setRoleState(appRole);
      setNameState(userData.nombre);
      setBackendRoleState(roleName);
      
      console.log('✅ Sesión restaurada:', userData.nombre);
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      // Token inválido o expirado, limpiar sesión
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback((token: string, userData: UserInfo) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
    
  // Sincronizar con tu sistema de roles (por nombre, con fallback)
  const roleName = (userData as any).role_name || userData.role?.nombre_rol || null;
  const appRole = roleName === 'admin' || roleName === 'superadmin' || userData.id_rol === 2 ? 'OWNER' : 'CUSTOMER';
    setRoleState(appRole);
    console.log('✅ Usuario logueado:', userData.nombre);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setRoleState(null);
    setTemp({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('userRole');
      localStorage.removeItem('selectedRole');
      localStorage.removeItem('active-business-storage'); // Limpiar negocio activo (persist store)
      localStorage.removeItem('active_business_id'); // Limpiar helper
    }
    console.log('✅ Sesión cerrada');
  }, []);

  const setRole = useCallback((newRole: AppRole) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      if (newRole) {
        localStorage.setItem('userRole', newRole);
      } else {
        localStorage.removeItem('userRole');
      }
    }
  }, []);

  const setName = useCallback((n: string | null) => {
    setNameState(n);
  }, []);

  const setBackendRole = useCallback((r: BackendRole) => {
    setBackendRoleState(r);
  }, []);

  const setTempData = useCallback((k: string, v: unknown) => {
    setTemp(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <UserContext.Provider value={{ 
      // Nuevo estado de autenticación
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      checkAuth,
      
      // Estado existente
      role, 
      setRole, 
      name,
      setName,
      backendRole,
      setBackendRole,
      tempData, 
      setTempData, 
      reset
    }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUserStore() {
  const ctx = useContext(UserContext);
  if(!ctx) throw new Error('useUserStore must be used within <UserProvider>');
  return ctx;
}