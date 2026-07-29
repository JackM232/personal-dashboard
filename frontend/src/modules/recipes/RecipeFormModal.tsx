import { useState } from "react";
import { EntityFormModal } from "../../components/EntityFormModal";
import { TagMultiSelect } from "./TagMultiSelect";
import { recipeFields, toRecipeBody } from "./recipeFields";
import type { Recipe, RecipeTag } from "./types";

interface RecipeFormModalProps {
  open: boolean;
  onClose: () => void;
  // Absent for a create; present for an edit.
  recipe?: Recipe | null;
  onSubmit: (body: Partial<Recipe>) => Promise<void>;
}

// Recipe metadata plus the tag picker. Tags live outside EntityFormModal's
// value bag because FieldConfig has no array type; they're merged back in at
// submit time. Unmounting while closed (rather than always rendering and
// deferring to EntityFormModal's own open prop) is what re-seeds `tags` per
// recipe without an effect.
export function RecipeFormModal({ open, onClose, recipe, onSubmit }: RecipeFormModalProps) {
  if (!open) return null;
  return <OpenRecipeFormModal onClose={onClose} recipe={recipe} onSubmit={onSubmit} />;
}

interface OpenRecipeFormModalProps {
  onClose: () => void;
  recipe?: Recipe | null;
  onSubmit: (body: Partial<Recipe>) => Promise<void>;
}

function OpenRecipeFormModal({ onClose, recipe, onSubmit }: OpenRecipeFormModalProps) {
  const [tags, setTags] = useState<RecipeTag[]>(recipe?.tags ?? []);

  const initialValues = recipe
    ? {
        name: recipe.name,
        description: recipe.description ?? "",
        mealType: recipe.mealType,
        cuisine: recipe.cuisine,
        difficulty: recipe.difficulty,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        servings: recipe.servings,
        calories: recipe.calories,
        proteinGrams: recipe.proteinGrams,
        carbGrams: recipe.carbGrams,
        fatGrams: recipe.fatGrams,
        sourceUrl: recipe.sourceUrl ?? "",
      }
    : undefined;

  return (
    <EntityFormModal
      open={true}
      onClose={onClose}
      title={recipe ? `Edit ${recipe.name}` : "Add Recipe"}
      fields={recipeFields}
      initialValues={initialValues}
      onSubmit={(values) => onSubmit({ ...toRecipeBody(values), tags })}
      submitLabel={recipe ? "Save" : "Add"}
    >
      <TagMultiSelect label="Tags" value={tags} onChange={setTags} />
    </EntityFormModal>
  );
}
