import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api, { registerAuthenticationFailureHandler } from '../api/client';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../api/tokens';
import type { AuthUser, LoginResponse } from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await api.get<AuthUser>('/api/auth/me/');
    setUser(response.data);
    return response.data;
  }, []);

  const login = useCallback(async (username: string, password: string, remember = true) => {
    const response = await api.post<LoginResponse>('/api/auth/login/', { username, password });
    setTokens(response.data.access, response.data.refresh, remember);
    return refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const unregister = registerAuthenticationFailureHandler(() => {
      logout();
      if (window.location.pathname !== '/auth') window.location.assign('/auth');
    });

    const restoreSession = async () => {
      if (!getAccessToken() && !getRefreshToken()) {
        setLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    void restoreSession();
    return unregister;
  }, [logout, refreshUser]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    loading,
    login,
    logout,
    refreshUser,
  }), [user, loading, login, logout, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.');
  return context;
}
