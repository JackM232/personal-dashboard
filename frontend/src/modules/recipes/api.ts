import { api } from "../../api/client";
import type {
  CookLog,
  IngredientInput,
  Recipe,
  RecipeFavorite,
  RecipeIngredient,
  RecipeStep,
  StepInput,
} from "./types";

export const recipesApi = {
  listRecipes: () => api.get<Recipe[]>("/api/recipes"),
  getRecipe: (id: string) => api.get<Recipe>(`/api/recipes/${id}`),
  createRecipe: (body: Partial<Recipe>) => api.post<Recipe>("/api/recipes", body),
  updateRecipe: (id: string, body: Partial<Recipe>) => api.put<Recipe>(`/api/recipes/${id}`, body),
  deleteRecipe: (id: string) => api.delete<void>(`/api/recipes/${id}`),

  // Whole-list replacements — the editors always submit every row.
  replaceIngredients: (id: string, ingredients: IngredientInput[]) =>
    api.put<RecipeIngredient[]>(`/api/recipes/${id}/ingredients`, { ingredients }),
  replaceSteps: (id: string, steps: StepInput[]) =>
    api.put<RecipeStep[]>(`/api/recipes/${id}/steps`, { steps }),

  listCookLogs: () => api.get<CookLog[]>("/api/cook-logs"),
  createCookLog: (body: Partial<CookLog>) => api.post<CookLog>("/api/cook-logs", body),
  updateCookLog: (id: string, body: Partial<CookLog>) =>
    api.put<CookLog>(`/api/cook-logs/${id}`, body),
  deleteCookLog: (id: string) => api.delete<void>(`/api/cook-logs/${id}`),

  listFavorites: () => api.get<RecipeFavorite[]>("/api/recipe-favorites"),
  addFavorite: (recipeId: string) =>
    api.post<RecipeFavorite>("/api/recipe-favorites", { recipeId }),
  removeFavorite: (recipeId: string) => api.delete<void>(`/api/recipe-favorites/${recipeId}`),
};
