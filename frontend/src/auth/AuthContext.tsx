import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, type AuthUser } from "../api/auth";
import { clearToken, getToken, setToken } from "../api/client";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // No token means there's nothing to fetch — loading starts false so we don't
  // need an effect to synchronously flip it back off on mount.
  const [loading, setLoading] = useState(() => Boolean(getToken()));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!getToken()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  // Cached module data belongs to whoever was signed in when it was fetched;
  // dropping it on every identity change keeps one account's rows from being
  // served to the next.
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      queryClient.clear();
      setToken(res.token);
      setUser(res.user);
    },
    [queryClient],
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const res = await authApi.register(email, username, password);
      queryClient.clear();
      setToken(res.token);
      setUser(res.user);
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
