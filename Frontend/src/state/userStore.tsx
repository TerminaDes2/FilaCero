// Unified, conflict-free implementation
'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, type ApiError, type UserInfo } from '../lib/api';

export type AppRole = 'CUSTOMER' | 'OWNER' | null;
export type BackendRole = 'usuario' | 'admin' | string | null;

type TempData = Record<string, unknown>;

interface UserContextValue {
  user: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  role: AppRole;
  backendRole: BackendRole;
  name: string | null;
  tempData: TempData;
  login: (token: string, userData: UserInfo) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setRole: (role: AppRole) => void;
  setName: (name: string | null) => void;
  setBackendRole: (role: BackendRole) => void;
  setTempData: (key: string, value: unknown) => void;
  reset: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const isPendingVerificationError = (error: unknown): error is ApiError => {
  const maybeError = error as ApiError | undefined;
  return Boolean(
    maybeError &&
      maybeError.status === 401 &&
      typeof maybeError.message === 'string' &&
      maybeError.message.toLowerCase().includes('verificación'),
  );
};

type StorageKeys =
  | 'auth_token'
  | 'auth_user'
  | 'auth_user_fallback_reason'
  | 'selectedRole'
  | 'userRole';

const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;
  const keys: StorageKeys[] = ['auth_token', 'auth_user', 'auth_user_fallback_reason', 'selectedRole', 'userRole'];
  for (const key of keys) window.localStorage.removeItem(key);
};

const persistUserSnapshot = (userData: UserInfo) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('auth_user', JSON.stringify(userData));
  window.localStorage.removeItem('auth_user_fallback_reason');
};

const loadStoredUser = (): UserInfo | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem('auth_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UserInfo;
  } catch (error) {
    console.error('Error parsing stored auth_user', error);
    return null;
  }
};

const deriveBackendRole = (userData: UserInfo | null): BackendRole => {
  if (!userData) return null;
  const roleName = (userData as any).role_name ?? userData.role?.nombre_rol ?? null;
  return roleName as BackendRole;
};

const deriveAppRole = (userData: UserInfo | null): AppRole => {
  if (!userData) return null;
  const backendRole = deriveBackendRole(userData);
  if (backendRole === 'admin' || backendRole === 'superadmin') return 'OWNER';
  return userData.id_rol === 2 ? 'OWNER' : 'CUSTOMER';
};

const deriveDisplayName = (userData: UserInfo | null): string | null => {
  if (!userData) return null;
  return userData.nombre ?? userData.correo_electronico ?? null;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<AppRole>(null);
  const [backendRole, setBackendRoleState] = useState<BackendRole>(null);
  const [name, setNameState] = useState<string | null>(null);
  const [tempData, setTemp] = useState<TempData>({});

  const applyUserSnapshot = useCallback((nextUser: UserInfo | null) => {
    setUser(nextUser);
    setRoleState(deriveAppRole(nextUser));
    setBackendRoleState(deriveBackendRole(nextUser));
    setNameState(deriveDisplayName(nextUser));
  }, []);

  const hydrateFromStorage = useCallback(() => {
    const storedUser = loadStoredUser();
    if (storedUser) {
      setBackendRoleState(deriveBackendRole(storedUser));
      setNameState(deriveDisplayName(storedUser));
      const storedRole = deriveAppRole(storedUser);
      if (storedRole) setRoleState(storedRole);
    } else {
      const storedRole = typeof window !== 'undefined' ? (window.localStorage.getItem('userRole') as AppRole | null) : null;
      if (storedRole === 'OWNER' || storedRole === 'CUSTOMER') setRoleState(storedRole);
    }
  }, []);

  const logout = useCallback(() => {
    applyUserSnapshot(null);
    setTemp({});
    if (typeof window !== 'undefined') {
      // Clean auth and any persisted business selection helpers
      clearStoredAuth();
      window.localStorage.removeItem('active-business-storage');
      window.localStorage.removeItem('active_business_id');
    }
    console.log('✅ Sesión cerrada');
  }, [applyUserSnapshot]);

  const login = useCallback(
    (token: string, userData: UserInfo) => {
      if (typeof window !== 'undefined') window.localStorage.setItem('auth_token', token);
      persistUserSnapshot(userData);
      applyUserSnapshot(userData);
    },
    [applyUserSnapshot],
  );

  const setRole = useCallback((newRole: AppRole) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      if (newRole) window.localStorage.setItem('userRole', newRole);
      else window.localStorage.removeItem('userRole');
    }
  }, []);

  const setName = useCallback((nextName: string | null) => setNameState(nextName), []);
  const setBackendRole = useCallback((nextRole: BackendRole) => setBackendRoleState(nextRole), []);
  const setTempData = useCallback((key: string, value: unknown) => setTemp(prev => ({ ...prev, [key]: value })), []);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
      if (!token) {
        applyUserSnapshot(null);
        return;
      }

      try {
        const userData = await api.me();
        persistUserSnapshot(userData);
        applyUserSnapshot(userData);
        return;
      } catch (error) {
        if (isPendingVerificationError(error)) {
          const storedUser = loadStoredUser();
          if (storedUser) {
            applyUserSnapshot(storedUser);
            console.warn('⚠️ Sesión restaurada con datos básicos por verificación pendiente.');
            return;
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      clearStoredAuth();
      applyUserSnapshot(null);
    } finally {
      hydrateFromStorage();
      setLoading(false);
    }
  }, [applyUserSnapshot, hydrateFromStorage]);

  const reset = useCallback(() => {
    logout();
  }, [logout]);

  useEffect(() => {
    hydrateFromStorage();
    void checkAuth();
  }, [checkAuth, hydrateFromStorage]);

  const value: UserContextValue = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    role,
    backendRole,
    name,
    tempData,
    login,
    logout,
    checkAuth,
    setRole,
    setName,
    setBackendRole,
    setTempData,
    reset,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export function useUserStore() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserStore must be used within <UserProvider>');
  return ctx;
}
