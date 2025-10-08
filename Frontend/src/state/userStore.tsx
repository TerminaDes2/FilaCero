// userStore.tsx - VERSIÓN COMPLETA
"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, UserInfo } from '../lib/api'; // Ajusta la ruta según tu estructura

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
      const storedUser = localStorage.getItem('auth_user');
      let parsedUser: any | null = null;
      if (storedUser) {
        try { parsedUser = JSON.parse(storedUser); } catch {}
      }
      const token = localStorage.getItem('auth_token');
      // Populate from stored user first
      if (parsedUser) {
        setNameState(parsedUser?.name || parsedUser?.nombre || null);
        setBackendRoleState((parsedUser?.role as BackendRole) ?? null);
      }
      // If we have token but no name yet, fetch me()
      if (token && !(parsedUser?.name || parsedUser?.nombre)) {
        import('../lib/api').then(({ api }) => {
          api.me().then((u)=>{
            const newName = u?.name || (u as any)?.nombre || null;
            setNameState(newName);
            setBackendRoleState((u?.role as BackendRole) ?? null);
            try {
              const merged = { ...(parsedUser || {}), ...(u || {}) };
              localStorage.setItem('auth_user', JSON.stringify(merged));
            } catch {}
          }).catch(()=>{});
        }).catch(()=>{});
      }
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
      const storedRole = localStorage.getItem('userRole') as AppRole;
      console.log('🔄 UserStore: Loading role from localStorage:', storedRole);
      if (storedRole) {
        setRoleState(storedRole);
      }
      const storedUser = localStorage.getItem('auth_user');
      let parsedUser: any | null = null;
      if (storedUser) {
        try { parsedUser = JSON.parse(storedUser); } catch {}
      }
      const token = localStorage.getItem('auth_token');
      // Populate from stored user first
      if (parsedUser) {
        setNameState(parsedUser?.name || parsedUser?.nombre || null);
        setBackendRoleState((parsedUser?.role as BackendRole) ?? null);
      }
      // If we have token but no name yet, fetch me()
      if (token && !(parsedUser?.name || parsedUser?.nombre)) {
        import('../lib/api').then(({ api }) => {
          api.me().then((u)=>{
            const newName = u?.name || (u as any)?.nombre || null;
            setNameState(newName);
            setBackendRoleState((u?.role as BackendRole) ?? null);
            try {
              const merged = { ...(parsedUser || {}), ...(u || {}) };
              localStorage.setItem('auth_user', JSON.stringify(merged));
            } catch {}
          }).catch(()=>{});
        }).catch(()=>{});
      }
    }
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
    setRoleState(null);
    setNameState(null);
    setBackendRoleState(null);
    setTemp({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userRole');
      localStorage.removeItem('selectedRole');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, []);

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