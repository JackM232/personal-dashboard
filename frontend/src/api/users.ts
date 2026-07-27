import { api } from "./client";
import type { AuthUser, Role } from "./auth";

export const usersApi = {
  listUsers: () => api.get<AuthUser[]>("/api/users"),
  updateUserRole: (id: string, role: Role) => api.put<AuthUser>(`/api/users/${id}/role`, { role }),
};
