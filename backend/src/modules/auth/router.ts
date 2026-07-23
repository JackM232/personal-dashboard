import { Router } from "express";
import * as controller from "./controller";
import { requireAuth } from "./middleware";

export const authRouter = Router();

authRouter.post("/auth/register", controller.register);
authRouter.post("/auth/login", controller.login);
authRouter.get("/auth/me", requireAuth, controller.me);
