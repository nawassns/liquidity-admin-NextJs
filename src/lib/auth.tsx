"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, tokenStore } from "./api";

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setLoading(false);
      return;
    }
    const res = await api.get<AdminUser>("/auth/me");
    if (res.success && res.data) {
      setUser(res.data);
    } else {
      tokenStore.remove();
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; admin: AdminUser }>(
      "/auth/login",
      { email, password },
    );
    if (res.success && res.data?.token) {
      tokenStore.set(res.data.token);
      setUser(res.data.admin);
      return { ok: true };
    }
    return { ok: false, error: res.message || "Login failed" };
  };

  const logout = () => {
    tokenStore.remove();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
