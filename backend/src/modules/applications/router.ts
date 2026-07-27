import { Router } from "express";
import * as controller from "./controller";
import { requireAuth } from "../auth/middleware";

// Every route is scoped to the calling user; it's mounted at /api by the registry.
export const applicationsRouter = Router();

applicationsRouter.get("/applications", requireAuth, controller.listApplications);
applicationsRouter.post("/applications", requireAuth, controller.createApplication);
applicationsRouter.get("/applications/:id", requireAuth, controller.getApplication);
applicationsRouter.put("/applications/:id", requireAuth, controller.updateApplication);
applicationsRouter.delete("/applications/:id", requireAuth, controller.deleteApplication);

applicationsRouter.get("/interviews", requireAuth, controller.listInterviews);
applicationsRouter.post("/interviews", requireAuth, controller.createInterview);
applicationsRouter.put("/interviews/:id", requireAuth, controller.updateInterview);
applicationsRouter.delete("/interviews/:id", requireAuth, controller.deleteInterview);
