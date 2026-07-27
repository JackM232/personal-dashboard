import { Router } from "express";
import * as controller from "./controller";
import { requireAuth, requireRole } from "../auth/middleware";
import { Role } from "../../generated/prisma";

// Catalog, cook log and favourites live on one router; it's mounted at /api by
// the registry.
export const recipesRouter = Router();

const canManageRecipes = requireRole(Role.CONTRIBUTOR, Role.ADMIN);

// Shared recipe catalog — reads open to any authed user, writes gated.
recipesRouter.get("/recipes", requireAuth, controller.listRecipes);
recipesRouter.get("/recipes/:id", requireAuth, controller.getRecipe);
recipesRouter.post("/recipes", requireAuth, canManageRecipes, controller.createRecipe);
recipesRouter.put("/recipes/:id", requireAuth, canManageRecipes, controller.updateRecipe);
recipesRouter.delete("/recipes/:id", requireAuth, canManageRecipes, controller.deleteRecipe);

// Ingredients and steps are replaced wholesale by their editors.
recipesRouter.put("/recipes/:id/ingredients", requireAuth, canManageRecipes, controller.replaceIngredients);
recipesRouter.put("/recipes/:id/steps", requireAuth, canManageRecipes, controller.replaceSteps);

// Per-user cook log
recipesRouter.get("/cook-logs", requireAuth, controller.listCookLogs);
recipesRouter.post("/cook-logs", requireAuth, controller.createCookLog);
recipesRouter.put("/cook-logs/:id", requireAuth, controller.updateCookLog);
recipesRouter.delete("/cook-logs/:id", requireAuth, controller.deleteCookLog);

// Per-user favourites — deleted by recipe id, not favourite id
recipesRouter.get("/recipe-favorites", requireAuth, controller.listFavorites);
recipesRouter.post("/recipe-favorites", requireAuth, controller.createFavorite);
recipesRouter.delete("/recipe-favorites/:recipeId", requireAuth, controller.deleteFavorite);
