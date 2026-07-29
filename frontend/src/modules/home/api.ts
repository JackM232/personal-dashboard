import { api } from "../../api/client";
import type { DashboardLayout } from "./types";

export const dashboardApi = {
  // Returns the shipped default rather than 404ing when the user has never
  // customised anything, so the caller has one code path.
  getLayout: () => api.get<DashboardLayout>("/api/dashboard-layout"),
  saveLayout: (body: DashboardLayout) => api.put<void>("/api/dashboard-layout", body),
};
