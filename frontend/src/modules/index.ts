import type { ComponentType } from "react";
import { LeetCodePage } from "./leetcode/LeetCodePage";

export interface DashboardModule {
  name: string;
  path: string; // route path, relative to /
  component: ComponentType;
}

// Register new tracker modules here — App.tsx renders a route for each.
export const modules: DashboardModule[] = [
  {
    name: "LeetCode",
    path: "/leetcode",
    component: LeetCodePage,
  },
];
