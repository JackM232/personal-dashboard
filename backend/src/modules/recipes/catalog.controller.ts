import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import {
  Cuisine,
  MealType,
  MeasurementUnit,
  RecipeDifficulty,
  RecipeTag,
} from "../../generated/prisma";

function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && value in enumObj;
}

// ─────────────────────────────────────────
// /api/recipes — shared recipe catalog
// ─────────────────────────────────────────

// Ingredients and steps are always read in cooking order; nothing downstream
// should have to sort them again.
const recipeInclude = {
  ingredients: { orderBy: { position: "asc" } },
  steps: { orderBy: { position: "asc" } },
} as const;

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

function parseTags(value: unknown): Parsed<RecipeTag[]> {
  if (!Array.isArray(value)) {
    return { ok: false, error: "tags must be an array" };
  }
  for (const tag of value) {
    if (!isEnumValue(RecipeTag, tag)) {
      return { ok: false, error: `Invalid tag: ${tag}` };
    }
  }
  // De-duplicate so a repeated flag can't render the same chip twice.
  return { ok: true, value: [...new Set(value as RecipeTag[])] };
}

interface IngredientRow {
  position: number;
  quantity: number | null;
  unit: MeasurementUnit | null;
  name: string;
  note: string | null;
}

// `position` is assigned from the array index rather than trusted from the
// client — the editor's list order *is* the recipe's order, and deriving it
// here keeps positions gap-free after a reorder or a delete.
function parseIngredients(value: unknown): Parsed<IngredientRow[]> {
  if (!Array.isArray(value)) {
    return { ok: false, error: "ingredients must be an array" };
  }

  const rows: IngredientRow[] = [];
  for (const [index, raw] of value.entries()) {
    const item = raw as Record<string, unknown>;
    const name = typeof item?.name === "string" ? item.name.trim() : "";
    if (!name) {
      return { ok: false, error: `Ingredient ${index + 1} needs a name` };
    }

    // A null quantity is legitimate — "salt, to taste" has no number.
    let quantity: number | null = null;
    if (item.quantity !== null && item.quantity !== undefined && item.quantity !== "") {
      const parsed = Number(item.quantity);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return { ok: false, error: `Ingredient ${index + 1} has an invalid quantity` };
      }
      quantity = parsed;
    }

    let unit: MeasurementUnit | null = null;
    if (item.unit !== null && item.unit !== undefined && item.unit !== "") {
      if (!isEnumValue(MeasurementUnit, item.unit)) {
        return { ok: false, error: `Invalid unit: ${item.unit}` };
      }
      unit = item.unit;
    }

    rows.push({
      position: index,
      quantity,
      unit,
      name,
      note: typeof item.note === "string" && item.note.trim() ? item.note.trim() : null,
    });
  }

  return { ok: true, value: rows };
}

interface StepRow {
  position: number;
  instruction: string;
  minutes: number | null;
}

function parseSteps(value: unknown): Parsed<StepRow[]> {
  if (!Array.isArray(value)) {
    return { ok: false, error: "steps must be an array" };
  }

  const rows: StepRow[] = [];
  for (const [index, raw] of value.entries()) {
    const item = raw as Record<string, unknown>;
    const instruction = typeof item?.instruction === "string" ? item.instruction.trim() : "";
    if (!instruction) {
      return { ok: false, error: `Step ${index + 1} needs an instruction` };
    }

    let minutes: number | null = null;
    if (item.minutes !== null && item.minutes !== undefined && item.minutes !== "") {
      const parsed = Number(item.minutes);
      if (!Number.isInteger(parsed) || parsed < 0) {
        return { ok: false, error: `Step ${index + 1} has invalid minutes` };
      }
      minutes = parsed;
    }

    rows.push({ position: index, instruction, minutes });
  }

  return { ok: true, value: rows };
}

// Shared by create and update — the numeric fields have the same bounds either way.
function invalidNumbers(body: Record<string, unknown>): string | null {
  const { servings, prepMinutes, cookMinutes } = body;

  if (servings !== undefined && (!Number.isInteger(servings) || (servings as number) < 1)) {
    return "servings must be a whole number of at least 1";
  }
  for (const field of ["prepMinutes", "cookMinutes"] as const) {
    const value = body[field];
    if (value !== undefined && (!Number.isInteger(value) || (value as number) < 0)) {
      return `${field} must be zero or more`;
    }
  }
  for (const field of ["calories", "proteinGrams", "carbGrams", "fatGrams"] as const) {
    const value = body[field];
    if (value === undefined || value === null) continue;
    if (!Number.isInteger(value) || (value as number) < 0) {
      return `${field} must be zero or more`;
    }
  }
  return null;
}

export async function listRecipes(_req: Request, res: Response) {
  try {
    const recipes = await prisma.recipe.findMany({
      orderBy: { name: "asc" },
      include: recipeInclude,
    });
    res.json(recipes);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
}

export async function getRecipe(req: Request, res: Response) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: req.params.id as string },
      include: recipeInclude,
    });
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    res.json(recipe);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
}

export async function createRecipe(req: Request, res: Response) {
  const {
    name, description, mealType, cuisine, difficulty,
    prepMinutes, cookMinutes, servings,
    calories, proteinGrams, carbGrams, fatGrams,
    tags, sourceUrl, ingredients, steps,
  } = req.body;

  if (!name || !mealType) {
    return res.status(400).json({ error: "name and mealType are required" });
  }
  if (!isEnumValue(MealType, mealType)) {
    return res.status(400).json({ error: "Invalid mealType" });
  }
  if (cuisine !== undefined && !isEnumValue(Cuisine, cuisine)) {
    return res.status(400).json({ error: "Invalid cuisine" });
  }
  if (difficulty !== undefined && !isEnumValue(RecipeDifficulty, difficulty)) {
    return res.status(400).json({ error: "Invalid difficulty" });
  }

  const numberError = invalidNumbers(req.body);
  if (numberError) {
    return res.status(400).json({ error: numberError });
  }

  const parsedTags = parseTags(tags ?? []);
  if (!parsedTags.ok) {
    return res.status(400).json({ error: parsedTags.error });
  }
  // Ingredients and steps are optional at create time — the detail editors can
  // fill them in afterwards via the replace-all endpoints.
  const parsedIngredients = parseIngredients(ingredients ?? []);
  if (!parsedIngredients.ok) {
    return res.status(400).json({ error: parsedIngredients.error });
  }
  const parsedSteps = parseSteps(steps ?? []);
  if (!parsedSteps.ok) {
    return res.status(400).json({ error: parsedSteps.error });
  }

  try {
    const recipe = await prisma.recipe.create({
      data: {
        name, description, mealType, cuisine, difficulty,
        prepMinutes, cookMinutes, servings,
        calories, proteinGrams, carbGrams, fatGrams,
        sourceUrl,
        tags: parsedTags.value,
        ingredients: { create: parsedIngredients.value },
        steps: { create: parsedSteps.value },
      },
      include: recipeInclude,
    });
    res.status(201).json(recipe);
  }
  catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A recipe with this name already exists" });
    }
    res.status(500).json({ error: "Failed to create recipe" });
  }
}

export async function updateRecipe(req: Request, res: Response) {
  const {
    name, description, mealType, cuisine, difficulty,
    prepMinutes, cookMinutes, servings,
    calories, proteinGrams, carbGrams, fatGrams,
    tags, sourceUrl,
  } = req.body;

  if (mealType !== undefined && !isEnumValue(MealType, mealType)) {
    return res.status(400).json({ error: "Invalid mealType" });
  }
  if (cuisine !== undefined && !isEnumValue(Cuisine, cuisine)) {
    return res.status(400).json({ error: "Invalid cuisine" });
  }
  if (difficulty !== undefined && !isEnumValue(RecipeDifficulty, difficulty)) {
    return res.status(400).json({ error: "Invalid difficulty" });
  }

  const numberError = invalidNumbers(req.body);
  if (numberError) {
    return res.status(400).json({ error: numberError });
  }

  let nextTags: RecipeTag[] | undefined;
  if (tags !== undefined) {
    const parsed = parseTags(tags);
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    nextTags = parsed.value;
  }

  try {
    // Ingredients and steps are deliberately untouched here — they have their
    // own replace-all endpoints, so a metadata edit can't wipe them.
    const recipe = await prisma.recipe.update({
      where: { id: req.params.id as string },
      data: {
        name, description, mealType, cuisine, difficulty,
        prepMinutes, cookMinutes, servings,
        calories, proteinGrams, carbGrams, fatGrams,
        sourceUrl,
        tags: nextTags,
      },
      include: recipeInclude,
    });
    res.json(recipe);
  }
  catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Recipe not found" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A recipe with this name already exists" });
    }
    res.status(500).json({ error: "Failed to update recipe" });
  }
}

export async function deleteRecipe(req: Request, res: Response) {
  try {
    await prisma.recipe.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  }
  catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Recipe not found" });
    }
    // Cook logs restrict the delete; ingredients, steps and favourites cascade.
    if (err.code === "P2003") {
      return res.status(409).json({ error: "Cannot delete a recipe that has been cooked" });
    }
    res.status(500).json({ error: "Failed to delete recipe" });
  }
}

// Bulk replace: the editor always submits the whole list, and an empty array
// legitimately clears it. Mirrors PUT /workout-exercises/:id/sets.
export async function replaceIngredients(req: Request, res: Response) {
  const recipeId = req.params.id as string;

  const parsed = parseIngredients(req.body?.ingredients);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    await prisma.$transaction([
      prisma.recipeIngredient.deleteMany({ where: { recipeId } }),
      prisma.recipeIngredient.createMany({
        data: parsed.value.map((row) => ({ ...row, recipeId })),
      }),
    ]);

    const ingredients = await prisma.recipeIngredient.findMany({
      where: { recipeId },
      orderBy: { position: "asc" },
    });
    res.json(ingredients);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to replace ingredients" });
  }
}

export async function replaceSteps(req: Request, res: Response) {
  const recipeId = req.params.id as string;

  const parsed = parseSteps(req.body?.steps);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    await prisma.$transaction([
      prisma.recipeStep.deleteMany({ where: { recipeId } }),
      prisma.recipeStep.createMany({
        data: parsed.value.map((row) => ({ ...row, recipeId })),
      }),
    ]);

    const steps = await prisma.recipeStep.findMany({
      where: { recipeId },
      orderBy: { position: "asc" },
    });
    res.json(steps);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to replace steps" });
  }
}
