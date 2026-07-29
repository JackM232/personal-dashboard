import type { FieldConfig } from "../../components/EntityFormModal";
import { CUISINES, DIFFICULTIES, MEAL_TYPES, humanize } from "./labels";
import type { CookLog, Recipe } from "./types";

function enumOptions(values: readonly string[]) {
  return values.map((value) => ({ value, label: humanize(value) }));
}

// Metadata only — ingredients, steps and tags have their own editors, since
// FieldConfig has no array field type.
export const recipeFields: FieldConfig<Recipe>[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "description", label: "Description", type: "text" },
  { key: "mealType", label: "Meal", type: "select", options: enumOptions(MEAL_TYPES), required: true },
  { key: "cuisine", label: "Cuisine", type: "select", options: enumOptions(CUISINES), required: true },
  { key: "difficulty", label: "Difficulty", type: "select", options: enumOptions(DIFFICULTIES), required: true },
  { key: "prepMinutes", label: "Prep (minutes)", type: "number", required: true },
  { key: "cookMinutes", label: "Cook (minutes)", type: "number", required: true },
  { key: "servings", label: "Servings", type: "number", required: true },
  { key: "calories", label: "Calories (per serving)", type: "number" },
  { key: "proteinGrams", label: "Protein (g)", type: "number" },
  { key: "carbGrams", label: "Carbs (g)", type: "number" },
  { key: "fatGrams", label: "Fat (g)", type: "number" },
  { key: "sourceUrl", label: "Source URL", type: "text" },
];

const RATING_OPTIONS = [
  { value: "", label: "No rating" },
  ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: "★".repeat(n) })),
];

export const cookLogFields: FieldConfig<CookLog>[] = [
  { key: "cookedAt", label: "Cooked on", type: "date", required: true },
  { key: "rating", label: "Rating", type: "select", options: RATING_OPTIONS },
  { key: "notes", label: "Notes", type: "text" },
];

// EntityFormModal hands back every field as a string; normalise to what the
// API expects.
export function toRecipeBody(values: Partial<Recipe>): Partial<Recipe> {
  const body: Partial<Recipe> = { ...values };
  for (const key of ["prepMinutes", "cookMinutes", "servings"] as const) {
    if (body[key] !== undefined && (body[key] as unknown) !== "") body[key] = Number(body[key]);
  }
  for (const key of ["calories", "proteinGrams", "carbGrams", "fatGrams"] as const) {
    // An emptied optional number arrives as "" — send null to clear it.
    body[key] = body[key] === undefined || (body[key] as unknown) === "" ? null : Number(body[key]);
  }
  for (const key of ["description", "sourceUrl"] as const) {
    if (!body[key]) body[key] = null;
  }
  return body;
}

export function toCookLogBody(values: Partial<CookLog>): Partial<CookLog> {
  const rating = values.rating;
  return {
    ...values,
    rating: rating === null || rating === undefined || (rating as unknown) === ""
      ? null
      : Number(rating),
    notes: values.notes || null,
  };
}
