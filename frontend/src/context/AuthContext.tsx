import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { setAccessToken, setUnauthorizedHandler } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// The one piece of genuinely cross-cutting client state (the session) —
// everything else server-derived goes through TanStack Query, not Context.
// See docs/02-architecture/adr/0005-react-vite-frontend.md.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    // On load, there's no access token in memory yet (a hard refresh clears
    // it) — attempt a silent refresh via the httpOnly cookie before giving
    // up on the session, per SPEC-001's "stay logged in across sessions".
    authApi
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password });
    setAccessToken(res.accessToken);
    setUser(res.user);
  }

  async function register(email: string, password: string, name: string) {
    const res = await authApi.register({ email, password, name });
    setAccessToken(res.accessToken);
    setUser(res.user);
  }

  async function logout() {
    await authApi.logout().catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
