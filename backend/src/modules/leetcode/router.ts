import { Router } from "express";
import * as controller from "./controller";
import { requireAuth, requireRole } from "../auth/middleware";
import { Role } from "../../generated/prisma";

// Both resource namespaces live on one router; it's mounted at /api by the registry.
export const leetcodeRouter = Router();

const canManageProblems = requireRole(Role.CONTRIBUTOR, Role.ADMIN);

// Shared problem catalog
leetcodeRouter.get("/problems", controller.listProblems);
leetcodeRouter.post("/problems", requireAuth, canManageProblems, controller.createProblem);
leetcodeRouter.get("/problems/:id", controller.getProblem);
leetcodeRouter.put("/problems/:id", requireAuth, canManageProblems, controller.updateProblem);
leetcodeRouter.delete("/problems/:id", requireAuth, canManageProblems, controller.deleteProblem);

// Per-user tracking entries
leetcodeRouter.get("/entries", requireAuth, controller.listEntries);
leetcodeRouter.post("/entries", requireAuth, controller.createEntry);
leetcodeRouter.put("/entries/:id", requireAuth, controller.updateEntry);
leetcodeRouter.delete("/entries/:id", requireAuth, controller.deleteEntry);
