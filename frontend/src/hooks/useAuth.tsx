import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('leadflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('leadflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on app initialization
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('leadflow_token');
      if (storedToken) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('leadflow_user', JSON.stringify(currentUser));
        } catch {
          // Token is invalid/expired
          localStorage.removeItem('leadflow_token');
          localStorage.removeItem('leadflow_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for unauthorized events emitted by apiClient
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('leadflow:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('leadflow:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    localStorage.setItem('leadflow_token', res.access_token);
    localStorage.setItem('leadflow_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, fullName: string, password: string) => {
    const res = await authService.register({ email, full_name: fullName, password });
    localStorage.setItem('leadflow_token', res.access_token);
    localStorage.setItem('leadflow_user', JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
