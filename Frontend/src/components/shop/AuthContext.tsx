"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verificar si hay token en localStorage al cargar la app
    const token = localStorage.getItem('authToken');
    if (token) {
      // Aquí podrías validar el token con el backend
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (token: string): void => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
  };

  const logout = (): void => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};