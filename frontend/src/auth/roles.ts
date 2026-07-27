import type { AuthUser, Role } from "../api/auth";

export const ROLES: Role[] = ["USER", "CONTRIBUTOR", "ADMIN"];

export const ASSIGNABLE_ROLES: Role[] = ["USER", "CONTRIBUTOR"];

export const CONTRIBUTOR_ROLES: Role[] = ["CONTRIBUTOR", "ADMIN"];

export function hasRole(user: AuthUser | null, ...roles: Role[]): boolean {
  return user ? roles.includes(user.role) : false;
}
