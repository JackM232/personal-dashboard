import { Router } from "express";
import * as controller from "./controller";
import { requireAuth } from "../auth/middleware";

// Tasks and the lists they sit on share one router; it's mounted at /api by the
// registry. Every row belongs to one user — there is no shared catalog here — so
// nothing is role-gated beyond requiring a login.
export const tasksRouter = Router();

// GET /tasks takes an optional ?listId=<id> to scope to one list, or
// ?listId=unsorted for the tasks that aren't on any list. Omit it for all three
// at once, which is what the UI fetches — it filters the one cached list
// client-side rather than refetching per view.
tasksRouter.get("/tasks", requireAuth, controller.listTasks);
tasksRouter.post("/tasks", requireAuth, controller.createTask);
tasksRouter.put("/tasks/:id", requireAuth, controller.updateTask);
tasksRouter.delete("/tasks/:id", requireAuth, controller.deleteTask);

tasksRouter.get("/task-lists", requireAuth, controller.listTaskLists);
tasksRouter.post("/task-lists", requireAuth, controller.createTaskList);
tasksRouter.put("/task-lists/:id", requireAuth, controller.updateTaskList);
tasksRouter.delete("/task-lists/:id", requireAuth, controller.deleteTaskList);
