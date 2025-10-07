"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type AppRole = 'CUSTOMER' | 'OWNER' | null;

interface UserState {
  role: AppRole;
  setRole: (r: AppRole) => void;
  tempData: Record<string, unknown>;
  setTempData: (k: string, v: unknown) => void;
  reset: () => void;
}

const UserContext = createContext<UserState | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<AppRole>(null);
  const [tempData, setTemp] = useState<Record<string, unknown>>({});

  // Cargar rol desde localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole') as AppRole;
      console.log('🔄 UserStore: Loading role from localStorage:', storedRole);
      if (storedRole) {
        setRoleState(storedRole);
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

  const setTempData = useCallback((k: string, v: unknown) => {
    setTemp(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = useCallback(() => {
    setRoleState(null);
    setTemp({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userRole');
      localStorage.removeItem('selectedRole');
    }
  }, []);

  return (
    <UserContext.Provider value={{ 
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