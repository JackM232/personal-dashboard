import type { ComponentType } from "react";
import type { Role } from "../api/auth";
import { queries, type ModuleQuery } from "../api/queries";
import { LeetCodePage } from "./leetcode/LeetCodePage";
import { UsersPage } from "./admin/UsersPage";
import { ApplicationsPage } from "./applications/ApplicationsPage";
import { GymPage } from "./gym/GymPage";
import { RecipesPage } from "./recipes/RecipesPage";
import { InvestmentsPage } from "./investments/InvestmentsPage";
import { ProjectsPage } from "./projects/ProjectsPage";

export type ModuleTheme = "purple" | "red" | "blue" | "green" | "orange" | "teal" | "pink";

export interface DashboardModule {
  name: string;
  path: string; // route path, relative to /
  component: ComponentType;
  requiredRoles?: Role[]; // omit to allow every logged-in user
  theme?: ModuleTheme; // accent colour while the module is open
  navPlacement?: "bottom"; // pinned above the sidebar footer instead of the main list
  nested?: boolean; // the module owns its own sub-routes under `path`
  // The lists this module needs before it can render. Warmed on login so the
  // page is a cache hit by the time it is opened — see useModulePrefetch.
  queries?: ModuleQuery[];
}

// Register new tracker modules here — App.tsx renders a route for each.
export const modules: DashboardModule[] = [
  {
    name: "LeetCode",
    path: "/leetcode",
    component: LeetCodePage,
    theme: "purple",
    queries: [queries.leetcodeEntries, queries.leetcodeProblems],
  },
  {
    name: "Applications",
    path: "/applications",
    component: ApplicationsPage,
    theme: "blue",
    queries: [queries.applications, queries.interviews],
  },
  {
    name: "Gym",
    path: "/gym",
    component: GymPage,
    theme: "green",
    queries: [queries.gymSessions, queries.gymExercises, queries.gymBodyweight],
  },
  {
    name: "Recipes",
    path: "/recipes",
    component: RecipesPage,
    theme: "orange",
    nested: true, // /recipes/:id renders a single recipe full-page
    queries: [queries.recipes, queries.cookLogs, queries.recipeFavorites],
  },
  {
    name: "Investments",
    path: "/investments",
    component: InvestmentsPage,
    theme: "teal",
    // The portfolio itself is parameterised by the selected account, so it is
    // fetched inline on the page rather than prefetched here.
    queries: [queries.investmentAccounts, queries.investmentTransactions, queries.watchlist],
  },
  {
    name: "Projects",
    path: "/projects",
    component: ProjectsPage,
    theme: "pink",
    queries: [queries.projects, queries.projectMilestones],
  },
  {
    name: "Users",
    path: "/users",
    component: UsersPage,
    requiredRoles: ["ADMIN"],
    theme: "red",
    navPlacement: "bottom",
    queries: [queries.users],
  },
];

export function visibleModules(role: Role | undefined): DashboardModule[] {
  return modules.filter((mod) => !mod.requiredRoles || (role && mod.requiredRoles.includes(role)));
}

export function moduleForPath(pathname: string): DashboardModule | undefined {
  return modules.find((mod) => pathname === mod.path || pathname.startsWith(`${mod.path}/`));
}
