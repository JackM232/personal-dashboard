import { Router } from "express";
import * as controller from "./controller";
import { requireAuth, requireRole } from "../auth/middleware";
import { Role } from "../../generated/prisma";

// Catalog and workout log live on one router; it's mounted at /api by the registry.
export const gymRouter = Router();

const canManageExercises = requireRole(Role.CONTRIBUTOR, Role.ADMIN);

// Shared exercise catalog — reads open to any authed user, writes gated.
// Unlike /problems, even reads require a login here.
gymRouter.get("/exercises", requireAuth, controller.listExercises);
gymRouter.get("/exercises/:id", requireAuth, controller.getExercise);
gymRouter.post("/exercises", requireAuth, canManageExercises, controller.createExercise);
gymRouter.put("/exercises/:id", requireAuth, canManageExercises, controller.updateExercise);
gymRouter.delete("/exercises/:id", requireAuth, canManageExercises, controller.deleteExercise);

// Per-user workout log
gymRouter.get("/workout-sessions", requireAuth, controller.listSessions);
gymRouter.post("/workout-sessions", requireAuth, controller.createSession);
gymRouter.get("/workout-sessions/:id", requireAuth, controller.getSession);
gymRouter.put("/workout-sessions/:id", requireAuth, controller.updateSession);
gymRouter.delete("/workout-sessions/:id", requireAuth, controller.deleteSession);

gymRouter.post("/workout-exercises", requireAuth, controller.createWorkoutExercise);
gymRouter.put("/workout-exercises/:id", requireAuth, controller.updateWorkoutExercise);
gymRouter.delete("/workout-exercises/:id", requireAuth, controller.deleteWorkoutExercise);
gymRouter.put("/workout-exercises/:id/sets", requireAuth, controller.replaceSets);

// Per-user bodyweight log — one weigh-in per day
gymRouter.get("/bodyweight-entries", requireAuth, controller.listBodyweightEntries);
gymRouter.post("/bodyweight-entries", requireAuth, controller.createBodyweightEntry);
gymRouter.put("/bodyweight-entries/:id", requireAuth, controller.updateBodyweightEntry);
gymRouter.delete("/bodyweight-entries/:id", requireAuth, controller.deleteBodyweightEntry);

// Derived reads
gymRouter.get("/gym/progression/:exerciseId", requireAuth, controller.getProgression);
gymRouter.get("/gym/muscle-volume", requireAuth, controller.getMuscleVolume);
