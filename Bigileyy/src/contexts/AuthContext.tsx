import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isViewer: boolean;
  login: (email: string) => Promise<void>;
  register: (userData: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
  switchRolePreset: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default Admin user for immediate out-of-the-box operation
const DEFAULT_ADMIN: UserProfile = {
  id: 'USR-ADMIN-01',
  email: 'admin@municipal.gov.in',
  name: 'Priyakshana (Director)',
  role: 'Admin',
  department: 'Solid Waste Directorate',
  phone: '+91 98765 43210',
  createdAt: '2026-01-15T08:00:00.000Z'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('eco_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_ADMIN;
      }
    }
    return DEFAULT_ADMIN;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('eco_auth_token') || 'tok_admin_default';
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('eco_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('eco_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('eco_auth_token', token);
    } else {
      localStorage.removeItem('eco_auth_token');
    }
  }, [token]);

  const login = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.login(email);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Partial<UserProfile>) => {
    setLoading(true);
    try {
      const res = await api.register(userData);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eco_user');
    localStorage.removeItem('eco_auth_token');
  };

  const switchRolePreset = async (targetRole: UserRole) => {
    if (targetRole === 'Admin') {
      await login('admin@municipal.gov.in');
    } else if (targetRole === 'Staff') {
      await login('staff@municipal.gov.in');
    } else {
      await login('auditor@environment.org');
    }
  };

  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Staff' || isAdmin;
  const isViewer = user?.role === 'Viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isStaff,
        isViewer,
        login,
        register,
        logout,
        switchRolePreset
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
