import { Router } from "express";
import * as controller from "./controller";
import { requireAuth } from "../auth/middleware";

// The home page's per-user card arrangement. One row per user, so there is no
// collection to list and no id in the path — the caller is the key.
export const dashboardRouter = Router();

dashboardRouter.get("/dashboard-layout", requireAuth, controller.getLayout);
dashboardRouter.put("/dashboard-layout", requireAuth, controller.saveLayout);
