'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthSessionUser } from '@/types';

interface AuthContextType {
  user: AuthSessionUser | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  switchDemoAccount: (role: 'requester' | 'volunteer' | 'coordinator', email?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        // Route according to role
        if (data.user.role === 'coordinator') router.push('/coordinator');
        else if (data.user.role === 'volunteer') router.push('/volunteer');
        else router.push('/requester');
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const switchDemoAccount = async (role: 'requester' | 'volunteer' | 'coordinator', customEmail?: string) => {
    let email = customEmail;
    if (!email) {
      if (role === 'coordinator') email = 'admin@careconnect.org';
      else if (role === 'volunteer') email = 'rahul@careconnect.org';
      else email = 'kamala@careconnect.org';
    }
    await login(email, 'Password123!');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, switchDemoAccount }}>
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
