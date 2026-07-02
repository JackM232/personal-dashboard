import { Router } from "express";
import { leetcodeRouter } from "./leetcode/router";

export interface DashboardModule {
  name: string;
  basePath: string; // mounted under this path by app.ts
  router: Router;
}

// Register new tracker modules here — app.ts mounts everything in this list.
export const modules: DashboardModule[] = [
  {
    name: "leetcode",
    basePath: "/api",
    router: leetcodeRouter,
  },
];
