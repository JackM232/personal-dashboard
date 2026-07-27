import type { ComponentType } from "react";
import type { Role } from "../api/auth";
import { LeetCodePage } from "./leetcode/LeetCodePage";
import { UsersPage } from "./admin/UsersPage";
import { ApplicationsPage } from "./applications/ApplicationsPage";
import { GymPage } from "./gym/GymPage";

export type ModuleTheme = "purple" | "red" | "blue" | "green";

export interface DashboardModule {
  name: string;
  path: string; // route path, relative to /
  component: ComponentType;
  requiredRoles?: Role[]; // omit to allow every logged-in user
  theme?: ModuleTheme; // accent colour while the module is open
  navPlacement?: "bottom"; // pinned above the sidebar footer instead of the main list
}

// Register new tracker modules here — App.tsx renders a route for each.
export const modules: DashboardModule[] = [
  {
    name: "LeetCode",
    path: "/leetcode",
    component: LeetCodePage,
    theme: "purple",
  },
  {
    name: "Applications",
    path: "/applications",
    component: ApplicationsPage,
    theme: "blue",
  },
  {
    name: "Gym",
    path: "/gym",
    component: GymPage,
    theme: "green",
  },
  {
    name: "Users",
    path: "/users",
    component: UsersPage,
    requiredRoles: ["ADMIN"],
    theme: "red",
    navPlacement: "bottom",
  },
];

export function visibleModules(role: Role | undefined): DashboardModule[] {
  return modules.filter((mod) => !mod.requiredRoles || (role && mod.requiredRoles.includes(role)));
}

export function moduleForPath(pathname: string): DashboardModule | undefined {
  return modules.find((mod) => pathname === mod.path || pathname.startsWith(`${mod.path}/`));
}
