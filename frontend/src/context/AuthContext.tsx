import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario, LoginRequest, RegisterRequest, AuthResponse } from '../types/index';
import axiosInstance from '../api/axios';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (dni: string, nombre: string, email: string, password: string) => Promise<void>;
  updateProfile: (payload: {
    dni?: string;
    nombre?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
  }) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize from localStorage on mount and validate token with backend.
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (!savedToken || !savedUser) {
        setAuthLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser) as Usuario;
        setToken(savedToken);
        setUser(parsedUser);

        const response = await axiosInstance.get<Usuario>('/api/auth/me');
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post<AuthResponse>('/api/auth/login', {
        email,
        password,
      } as LoginRequest);

      const { access_token: newToken, user } = response.data;
      setToken(newToken);
      setUser(user);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const register = async (dni: string, nombre: string, email: string, password: string) => {
    try {
      await axiosInstance.post('/api/auth/register', {
        dni,
        nombre,
        email,
        password,
      } as RegisterRequest);

      // El backend devuelve solo usuario en /register; autenticamos luego con /login.
      await login(email, password);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdmin = (): boolean => {
    return user?.rol === 'admin';
  };

  const updateProfile = async (payload: {
    dni?: string;
    nombre?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
  }) => {
    const response = await axiosInstance.put<Usuario>('/api/auth/me', payload);
    setUser(response.data);
    localStorage.setItem('user', JSON.stringify(response.data));
  };

  return (
    <AuthContext.Provider value={{ user, token, authLoading, login, register, updateProfile, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
