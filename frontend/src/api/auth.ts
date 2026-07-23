import { api } from "./client";

export type Role = "USER" | "CONTRIBUTOR" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  register: (email: string, username: string, password: string) =>
    api.post<AuthResponse>("/api/auth/register", { email, username, password }),
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", { email, password }),
  me: () => api.get<AuthUser>("/api/auth/me"),
};
