"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';

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
  const [role, setRole] = useState<AppRole>(null);
  const [tempData, setTemp] = useState<Record<string, unknown>>({});

  const setTempData = useCallback((k: string, v: unknown) => {
    setTemp(prev => ({ ...prev, [k]: v }));
  }, []);

  const reset = useCallback(() => {
    setRole(null);
    setTemp({});
  }, []);

  return (
    <UserContext.Provider value={{ role, setRole, tempData, setTempData, reset }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUserStore() {
  const ctx = useContext(UserContext);
  if(!ctx) throw new Error('useUserStore must be used within <UserProvider>');
  return ctx;
}
