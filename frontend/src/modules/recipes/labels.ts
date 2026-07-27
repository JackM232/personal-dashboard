import type {
  Cuisine,
  MealType,
  MeasurementUnit,
  RecipeDifficulty,
  RecipeIngredient,
  RecipeTag,
} from "./types";

export const MEAL_TYPES: MealType[] = [
  "BREAKFAST", "LUNCH", "DINNER", "SNACK", "DESSERT", "SIDE", "DRINK",
];

export const CUISINES: Cuisine[] = [
  "AMERICAN", "ITALIAN", "MEXICAN", "CHINESE", "JAPANESE", "KOREAN",
  "INDIAN", "THAI", "MEDITERRANEAN", "FRENCH", "MIDDLE_EASTERN", "OTHER",
];

export const DIFFICULTIES: RecipeDifficulty[] = ["EASY", "MEDIUM", "HARD"];

export const UNITS: MeasurementUnit[] = [
  "G", "KG", "ML", "L", "TSP", "TBSP", "CUP", "OZ", "LB",
  "PIECE", "CLOVE", "SLICE", "PINCH", "CAN", "BUNCH", "TO_TASTE",
];

// Grouped so the tag picker reads as categories rather than one long wall of
// checkboxes. The `family` also drives the chip colour — see RecipeChip.
export const TAG_SECTIONS: { label: string; family: string; tags: RecipeTag[] }[] = [
  { label: "Macros", family: "macro", tags: ["HIGH_PROTEIN", "LOW_CARB", "HIGH_CARB", "HIGH_FIBER", "LOW_CALORIE"] },
  { label: "Diet", family: "diet", tags: ["VEGETARIAN", "VEGAN", "GLUTEN_FREE", "DAIRY_FREE"] },
  { label: "Practical", family: "practical", tags: ["MEAL_PREP", "ONE_POT", "QUICK", "BUDGET", "SPICY"] },
];

export const ALL_TAGS: RecipeTag[] = TAG_SECTIONS.flatMap((section) => section.tags);

const TAG_FAMILY: Record<RecipeTag, string> = Object.fromEntries(
  TAG_SECTIONS.flatMap((section) => section.tags.map((tag) => [tag, section.family])),
) as Record<RecipeTag, string>;

export function tagFamily(tag: RecipeTag): string {
  return TAG_FAMILY[tag] ?? "practical";
}

// SCREAMING_SNAKE reads badly in a chip; Title Case everything by default and
// special-case the handful where that produces the wrong result.
const LABEL_OVERRIDES: Record<string, string> = {
  TO_TASTE: "to taste",
  TSP: "tsp",
  TBSP: "tbsp",
  ML: "ml",
  L: "l",
  G: "g",
  KG: "kg",
  OZ: "oz",
  LB: "lb",
  CUP: "cup",
  PIECE: "",
  MIDDLE_EASTERN: "Middle Eastern",
};

export function humanize(value: string): string {
  if (value in LABEL_OVERRIDES) return LABEL_OVERRIDES[value];
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Units that pluralise when the quantity is more than one. Metric units and
// "to taste" never do.
const PLURALIZABLE = new Set<MeasurementUnit>(["CUP", "CLOVE", "SLICE", "CAN", "BUNCH", "PINCH"]);

export function unitLabel(unit: MeasurementUnit | null, quantity: number | null): string {
  if (!unit) return "";
  const label = humanize(unit);
  if (!label) return "";
  if (quantity !== null && quantity > 1 && PLURALIZABLE.has(unit)) return `${label}s`;
  return label;
}

const VULGAR: [number, string][] = [
  [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"],
  [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"],
];

// Scaling 3 servings to 4 turns "2 cups" into 2.6666666666666665 — round to the
// nearest familiar kitchen fraction instead of dumping the float on screen.
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "";
  // Large amounts are always weights or volumes in the first place; fractions of
  // a gram help nobody.
  if (value >= 10) return String(Math.round(value));

  const whole = Math.floor(value);
  const remainder = value - whole;

  if (remainder < 0.06) return String(whole || 0);
  if (remainder > 0.94) return String(whole + 1);

  let best = VULGAR[0];
  for (const candidate of VULGAR) {
    if (Math.abs(candidate[0] - remainder) < Math.abs(best[0] - remainder)) best = candidate;
  }
  // Only trust the fraction if it's actually close; otherwise fall back to a decimal.
  if (Math.abs(best[0] - remainder) > 0.04) return value.toFixed(1);

  return whole ? `${whole}${best[1]}` : best[1];
}

// "2½ cups flour" — the whole ingredient line, already scaled.
export function ingredientText(ingredient: RecipeIngredient, scale: number): string {
  // "to taste" is a suffix in English, not a unit that precedes the ingredient.
  if (ingredient.unit === "TO_TASTE") return `${ingredient.name}, to taste`;

  const scaled = ingredient.quantity === null ? null : ingredient.quantity * scale;
  const quantity = scaled === null ? "" : formatQuantity(scaled);
  const unit = unitLabel(ingredient.unit, scaled);
  return [quantity, unit, ingredient.name].filter(Boolean).join(" ");
}

export function totalMinutes(recipe: { prepMinutes: number; cookMinutes: number }): number {
  return recipe.prepMinutes + recipe.cookMinutes;
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
