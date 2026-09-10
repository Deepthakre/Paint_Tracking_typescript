import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import * as api from '../lib/dataService';
import type { Role, User, RegisterPayload } from '../types';

interface AuthContextValue {
  user: User | null;
  login: (username: string, password: string, role: Role) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (username: string, password: string, role: Role) => {
    const u = await api.login(username, password, role);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const u = await api.register(payload);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  // Memoized so consumers that only read `user` (e.g. TopBar's nav) don't
  // re-render every time an unrelated component using this same context
  // re-renders for a different reason — the object identity only changes
  // when one of its actual contents does.
  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
