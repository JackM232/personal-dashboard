import { Router } from "express";
import { leetcodeRouter } from "./leetcode/router";
import { authRouter } from "./auth/router";
import { applicationsRouter } from "./applications/router";
import { gymRouter } from "./gym/router";
import { recipesRouter } from "./recipes/router";
import { investmentsRouter } from "./investments/router";
import { projectsRouter } from "./projects/router";
import { tasksRouter } from "./tasks/router";
import { dashboardRouter } from "./dashboard/router";

export interface DashboardModule {
  name: string;
  basePath: string; // mounted under this path by app.ts
  router: Router;
}

// Register new tracker modules here — app.ts mounts everything in this list.
export const modules: DashboardModule[] = [
  {
    name: "auth",
    basePath: "/api",
    router: authRouter,
  },
  {
    name: "leetcode",
    basePath: "/api",
    router: leetcodeRouter,
  },
  {
    name: "applications",
    basePath: "/api",
    router: applicationsRouter,
  },
  {
    name: "gym",
    basePath: "/api",
    router: gymRouter,
  },
  {
    name: "recipes",
    basePath: "/api",
    router: recipesRouter,
  },
  {
    name: "investments",
    basePath: "/api",
    router: investmentsRouter,
  },
  {
    name: "projects",
    basePath: "/api",
    router: projectsRouter,
  },
  {
    name: "tasks",
    basePath: "/api",
    router: tasksRouter,
  },
  {
    name: "dashboard",
    basePath: "/api",
    router: dashboardRouter,
  },
];
