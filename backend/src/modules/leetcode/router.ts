import { Router } from "express";
import * as controller from "./controller";

// Both resource namespaces live on one router; it's mounted at /api by the registry.
export const leetcodeRouter = Router();

// Shared problem catalog
leetcodeRouter.get("/problems", controller.listProblems);
leetcodeRouter.post("/problems", controller.createProblem);
leetcodeRouter.get("/problems/:id", controller.getProblem);
leetcodeRouter.put("/problems/:id", controller.updateProblem);
leetcodeRouter.delete("/problems/:id", controller.deleteProblem);

// Per-user tracking entries
leetcodeRouter.get("/entries", controller.listEntries);
leetcodeRouter.post("/entries", controller.createEntry);
leetcodeRouter.put("/entries/:id", controller.updateEntry);
leetcodeRouter.delete("/entries/:id", controller.deleteEntry);
