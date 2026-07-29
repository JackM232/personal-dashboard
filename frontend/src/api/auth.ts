import { api } from "./client";

export type Role = "USER" | "CONTRIBUTOR" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  name: string | null;
  timeZone: string | null; // IANA zone name, e.g. "America/Los_Angeles"
  bio: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// Empty strings clear the optional fields; omitted keys are left alone.
export interface ProfileUpdate {
  email?: string;
  username?: string;
  name?: string;
  timeZone?: string;
  bio?: string;
}

export const authApi = {
  register: (email: string, username: string, password: string) =>
    api.post<AuthResponse>("/api/auth/register", { email, username, password }),
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", { email, password }),
  me: () => api.get<AuthUser>("/api/auth/me"),
  updateProfile: (body: ProfileUpdate) => api.put<AuthUser>("/api/auth/me", body),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<void>("/api/auth/me/password", { currentPassword, newPassword }),
};
