/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TuStudyHub Auth & Role Context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../lib/api.ts';
import type { User, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  loading: boolean;
  isOnline: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    fullName: string,
    departmentId?: string,
    requestedRole?: string,
    contributorBio?: string
  ) => Promise<{ success: boolean; error?: string; message?: string; isPending?: boolean }>;
  logout: () => void;
  applyContributor: (deptId: string, bio: string, courses?: string[]) => Promise<{ success: boolean; error?: string; message?: string }>;
  switchRole: (newRole: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(ApiClient.getToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Monitor network connectivity for PWA resilience
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch user profile on mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await ApiClient.request<User>('/api/v1/auth/me');
      if (res.success && res.data) {
        setUser({ ...res.data, must_change_password: res.data.must_change_password });
      } else {
        // Token expired or invalid
        ApiClient.setToken(null);
        setTokenState(null);
        setUser(null);
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await ApiClient.request<{ user: User; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success && res.data) {
      ApiClient.setToken(res.data.token);
      setTokenState(res.data.token);
      if (res.data.user) {
          setUser({ ...res.data.user, must_change_password: res.data.user.must_change_password } as User);
        }
      return { success: true };
    }
    return { success: false, error: res.error?.message || 'Login failed' };
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    departmentId?: string,
    requestedRole?: string,
    contributorBio?: string
  ) => {
    const res = await ApiClient.request<{ user: User; token: string | null; message?: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, departmentId, requestedRole, contributorBio })
    });

    if (res.success && res.data) {
      if (res.data.token) {
        ApiClient.setToken(res.data.token);
        setTokenState(res.data.token);
        if (res.data.user) {
          setUser({ ...res.data.user, must_change_password: res.data.user.must_change_password } as User);
        }
      }
      return {
        success: true,
        message: res.data.message,
        isPending: res.data.user?.status === 'PENDING_APPROVAL'
      };
    }
    return { success: false, error: res.error?.message || 'Registration failed' };
  };

  const logout = () => {
    ApiClient.setToken(null);
    setTokenState(null);
    setUser(null);
  };

  const applyContributor = async (departmentId: string, bio: string, requestedCourses?: string[]) => {
    const res = await ApiClient.request<{ message: string; status: string }>('/api/v1/auth/apply-contributor', {
      method: 'POST',
      body: JSON.stringify({ departmentId, bio, requestedCourses })
    });

    if (res.success) {
      await refreshProfile();
      return { success: true, message: res.data?.message };
    }
    return { success: false, error: res.error?.message || 'Failed to submit application' };
  };

  const switchRole = async (newRole: UserRole) => {
    setLoading(true);
    const res = await ApiClient.request<{ user: User | null; token: string | null; role: UserRole }>('/api/v1/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role: newRole })
    });

    if (res.success && res.data) {
      if (res.data.token) {
        ApiClient.setToken(res.data.token);
        setTokenState(res.data.token);
        if (res.data.user) {
          setUser({ ...res.data.user, must_change_password: res.data.user.must_change_password } as User);
        }
      } else {
        // Visitor
        ApiClient.setToken(null);
        setTokenState(null);
        setUser(null);
      }
    }
    setLoading(false);
  };

  const refreshProfile = async () => {
    const res = await ApiClient.request<User>('/api/v1/auth/me');
    if (res.success && res.data) {
      setUser({ ...res.data, must_change_password: res.data.must_change_password });
    }
  };

  const activeRole: UserRole = user ? user.role : 'VISITOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        role: activeRole,
        token,
        loading,
        isOnline,
        login,
        register,
        logout,
        applyContributor,
        switchRole,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
