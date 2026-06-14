import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import { authApi, tokenStore } from "../../dataStore/v2Api/client";
import type { UserDto } from "../../types";

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login:    (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout:   () => Promise<void>;
  updateUser: (updates: Partial<UserDto>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<UserDto | null>(null);
  const [isLoading, setLoading] = useState(true);

  // On mount: restore session from stored tokens
  useEffect(() => {
    const token = tokenStore.getAccess();
    if (!token) { setLoading(false); return; }

    authApi.me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await authApi.login(email, password);
    tokenStore.set(auth);
    setUser(auth.user);
  }, []);

  const register = useCallback(async (
    email: string, password: string, displayName: string
  ) => {
    const auth = await authApi.register(email, password, displayName);
    tokenStore.set(auth);
    setUser(auth.user);
  }, []);

  const logout = useCallback(async () => {
    const userId       = tokenStore.getUserId();
    const refreshToken = tokenStore.getRefresh();
    if (userId && refreshToken) {
      await authApi.logout(userId, refreshToken).catch(() => {});
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<UserDto>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
