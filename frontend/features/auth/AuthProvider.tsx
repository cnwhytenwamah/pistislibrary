"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types/auth";

type Status = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: Status;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ status: Status; user: AuthUser | null }>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ user: AuthUser }>("/auth/me")
      .then(({ user }) => !cancelled && setState({ status: "authenticated", user }))
      .catch((err) => {
        // 401 simply means "not signed in"; other errors also leave the visitor anonymous
        if (!cancelled) setState({ status: "anonymous", user: null });
        if (!(err instanceof ApiError && err.status === 401)) console.error("Session check failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = useCallback(async (path: string, body: unknown) => {
    const { user } = await apiFetch<{ user: AuthUser }>(path, { method: "POST", body: JSON.stringify(body) });
    setState({ status: "authenticated", user });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: (email, password) => authenticate("/auth/login", { email, password }),
      register: (name, email, password) => authenticate("/auth/register", { name, email, password }),
      loginWithGoogle: (idToken) => authenticate("/auth/google", { idToken }),
      logout: async () => {
        await apiFetch("/auth/logout", { method: "POST", body: "{}" }).catch(() => undefined);
        setState({ status: "anonymous", user: null });
      },
    }),
    [state, authenticate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
