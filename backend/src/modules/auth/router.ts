import { Router } from "express";
import * as controller from "./controller";
import { requireAuth, requireRole } from "./middleware";
import { Role } from "../../generated/prisma";

export const authRouter = Router();

authRouter.post("/auth/register", controller.register);
authRouter.post("/auth/login", controller.login);
authRouter.get("/auth/me", requireAuth, controller.me);

authRouter.get("/users", requireAuth, requireRole(Role.ADMIN), controller.listUsers);
authRouter.put("/users/:id/role", requireAuth, requireRole(Role.ADMIN), controller.updateUserRole);
