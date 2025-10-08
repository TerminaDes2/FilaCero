// userStore.tsx - VERSIÓN COMPLETA
"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, UserInfo } from '../lib/api'; // Ajusta la ruta según tu estructura

export type AppRole = 'CUSTOMER' | 'OWNER' | null;

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
  tempData: Record<string, unknown>;
  setTempData: (k: string, v: unknown) => void;
  reset: () => void;
}

const UserContext = createContext<UserState | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<AppRole>(null);
  const [tempData, setTemp] = useState<Record<string, unknown>>({});

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (token) {
        const userData = await api.me();
        setUser(userData);
        // Sincronizar con tu sistema de roles existente
        const appRole = userData.id_rol === 2 ? 'OWNER' : 'CUSTOMER';
        setRoleState(appRole);
        console.log('✅ Sesión restaurada:', userData.nombre);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback((token: string, userData: UserInfo) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
    
    // Sincronizar con tu sistema de roles
    const appRole = userData.id_rol === 2 ? 'OWNER' : 'CUSTOMER';
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