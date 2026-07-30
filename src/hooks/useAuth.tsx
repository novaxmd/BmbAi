import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  provider: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithGithub: () => void;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginWithGithub = useCallback(() => {
    window.location.href = '/api/auth/github/login';
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = '/api/auth/google/login';
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithGithub, loginWithGoogle, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
