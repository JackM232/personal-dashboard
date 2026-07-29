import { Router } from "express";
import * as controller from "./controller";
import { requireAuth } from "../auth/middleware";

// Projects and their milestones share one router; it's mounted at /api by the
// registry. Every row belongs to one user — there is no shared catalog here — so
// nothing is role-gated beyond requiring a login.
export const projectsRouter = Router();

projectsRouter.get("/projects", requireAuth, controller.listProjects);
projectsRouter.post("/projects", requireAuth, controller.createProject);
projectsRouter.put("/projects/:id", requireAuth, controller.updateProject);
projectsRouter.delete("/projects/:id", requireAuth, controller.deleteProject);

// Milestones are owned through their project, so they are addressed by their own
// id rather than nested under /projects/:id.
projectsRouter.get("/project-milestones", requireAuth, controller.listMilestones);
projectsRouter.post("/project-milestones", requireAuth, controller.createMilestone);
projectsRouter.put("/project-milestones/:id", requireAuth, controller.updateMilestone);
projectsRouter.delete("/project-milestones/:id", requireAuth, controller.deleteMilestone);
