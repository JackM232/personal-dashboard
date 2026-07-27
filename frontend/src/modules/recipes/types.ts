export type MealType =
  | "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "DESSERT" | "SIDE" | "DRINK";

export type Cuisine =
  | "AMERICAN" | "ITALIAN" | "MEXICAN" | "CHINESE" | "JAPANESE" | "KOREAN"
  | "INDIAN" | "THAI" | "MEDITERRANEAN" | "FRENCH" | "MIDDLE_EASTERN" | "OTHER";

export type RecipeDifficulty = "EASY" | "MEDIUM" | "HARD";

export type RecipeTag =
  | "HIGH_PROTEIN" | "LOW_CARB" | "HIGH_CARB" | "HIGH_FIBER" | "LOW_CALORIE"
  | "VEGETARIAN" | "VEGAN" | "GLUTEN_FREE" | "DAIRY_FREE"
  | "MEAL_PREP" | "ONE_POT" | "QUICK" | "BUDGET" | "SPICY";

export type MeasurementUnit =
  | "G" | "KG" | "ML" | "L" | "TSP" | "TBSP" | "CUP" | "OZ" | "LB"
  | "PIECE" | "CLOVE" | "SLICE" | "PINCH" | "CAN" | "BUNCH" | "TO_TASTE";

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  position: number;
  quantity: number | null; // null for "to taste"
  unit: MeasurementUnit | null;
  name: string;
  note: string | null;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  position: number;
  instruction: string;
  minutes: number | null;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  mealType: MealType;
  cuisine: Cuisine;
  difficulty: RecipeDifficulty;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  calories: number | null;
  proteinGrams: number | null;
  carbGrams: number | null;
  fatGrams: number | null;
  tags: RecipeTag[];
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface CookLog {
  id: string;
  userId: string;
  recipeId: string;
  cookedAt: string;
  rating: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  recipe?: Recipe;
}

export interface RecipeFavorite {
  id: string;
  userId: string;
  recipeId: string;
  createdAt: string;
  recipe?: Recipe;
}

// The write shapes for the replace-all endpoints — no ids, no positions; the
// server derives position from array order.
export interface IngredientInput {
  quantity: number | null;
  unit: MeasurementUnit | null;
  name: string;
  note: string | null;
}

export interface StepInput {
  instruction: string;
  minutes: number | null;
}
