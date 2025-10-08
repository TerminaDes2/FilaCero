"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type AppRole = 'CUSTOMER' | 'OWNER' | null;
export type BackendRole = 'usuario' | 'admin' | string | null;

interface UserState {
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
  const [role, setRoleState] = useState<AppRole>(null);
  const [name, setNameState] = useState<string | null>(null);
  const [backendRole, setBackendRoleState] = useState<BackendRole>(null);
  const [tempData, setTemp] = useState<Record<string, unknown>>({});

  // Cargar rol desde localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    
    // Persistir en localStorage
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