// userStore.tsx - VERSIÓN COMPLETA
"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, type UserInfo, type ApiError } from '../lib/api';

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

  const isPendingVerificationError = (err: unknown): err is ApiError => {
    const candidate = err as ApiError | undefined;
    return Boolean(
      candidate &&
      candidate.status === 401 &&
      typeof candidate.message === 'string' &&
      candidate.message.toLowerCase().includes('verificación')
    );
  };

  const checkAuth = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (token) {
        try {
          const userData = await api.me();
          setUser(userData);
          const roleName = (userData as any).role_name || userData.role?.nombre_rol || null;
          const appRole = roleName === 'admin' || roleName === 'superadmin' || userData.id_rol === 2 ? 'OWNER' : 'CUSTOMER';
          setRoleState(appRole);
          console.log('✅ Sesión restaurada:', userData.nombre);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_user_fallback_reason');
          }
          return;
        } catch (err) {
          if (isPendingVerificationError(err)) {
            try {
              const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
              if (stored) {
                const parsed = JSON.parse(stored) as UserInfo;
                setUser(parsed);
                const roleName = (parsed as any).role_name || parsed.role?.nombre_rol || null;
                const appRole = roleName === 'admin' || roleName === 'superadmin' || parsed.id_rol === 2 ? 'OWNER' : 'CUSTOMER';
                setRoleState(appRole);
                setBackendRoleState(roleName as BackendRole);
                console.warn('⚠️ Sesión restaurada con datos básicos por verificación pendiente.');
                return;
              }
            } catch (storageErr) {
              console.error('Error restaurando usuario desde localStorage:', storageErr);
            }
          }
          throw err;
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      logout();
    } finally {
      setLoading(false);
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          setNameState(parsed?.name || parsed?.nombre || null);
          const storedBackendRole = (parsed?.role?.nombre_rol as BackendRole) ?? (parsed?.role_name as BackendRole) ?? null;
          setBackendRoleState(storedBackendRole);
        }
      } catch {}
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
      localStorage.removeItem('auth_user_fallback_reason');
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