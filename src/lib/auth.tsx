import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, setCsrfToken } from "./http";
import type { User } from "./types";
import PageSpinner from "../components/ui/PageSpinner";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdminRoute = useLocation().pathname.startsWith("/admin");

  useEffect(() => {
    // So consulta a sessao quando estamos no admin (site publico nao precisa)
    if (!isAdminRoute) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api<{ user: User; csrf: string }>("/data/auth/me")
      .then((r) => {
        if (cancelled) return;
        setCsrfToken(r.csrf);
        setUser(r.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ user: User; csrf: string }>("/data/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setCsrfToken(r.csrf);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/data/auth/logout", { method: "POST" });
    } finally {
      setCsrfToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
