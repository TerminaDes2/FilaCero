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
      if (storedUser) {
        try { const u = JSON.parse(storedUser); setNameState(u?.name || u?.nombre || null); } catch {}
      } else {
        const raw = localStorage.getItem('auth_token');
        if (raw) {
          // defer me() until mount
          import('../lib/api').then(({ api }) => {
            api.me().then((u)=>{
              setNameState(u?.name || (u as any)?.nombre || null);
              setBackendRoleState((u?.role as BackendRole) ?? null);
            }).catch(()=>{});
          }).catch(()=>{});
        }
      }
      const storedBackendRole = localStorage.getItem('auth_user');
      if (storedBackendRole) {
        try { const u = JSON.parse(storedBackendRole); setBackendRoleState((u?.role as BackendRole) ?? null); } catch {}
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