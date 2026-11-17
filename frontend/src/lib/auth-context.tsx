'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      // Verify token in background
      api.getMe()
        .then((fetchedUser) => {
          setUser(fetchedUser);
          setStoredUser(fetchedUser);
        })
        .catch(() => {
          // Token expired or invalid
          setStoredToken(null);
          setStoredUser(null);
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setToken(res.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: string = 'employee') => {
    setIsLoading(true);
    try {
      const res = await api.register(name, email, password, role);
      setUser(res.user);
      setToken(res.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setToken(null);
  };

  const quickLogin = async (role: UserRole) => {
    const roleCreds: Record<UserRole, { email: string; pass: string }> = {
      admin: { email: 'admin@dataguard.ai', pass: 'Admin@123' },
      manager: { email: 'manager@dataguard.ai', pass: 'Manager@123' },
      employee: { email: 'employee@dataguard.ai', pass: 'Employee@123' }
    };
    const cred = roleCreds[role];
    if (cred) {
      await login(cred.email, cred.pass);
    }
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
      setStoredUser(u);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, quickLogin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

