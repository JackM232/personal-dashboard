import { useEffect, useState } from "react";
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
// submit time.
export function RecipeFormModal({ open, onClose, recipe, onSubmit }: RecipeFormModalProps) {
  const [tags, setTags] = useState<RecipeTag[]>([]);

  useEffect(() => {
    if (open) setTags(recipe?.tags ?? []);
  }, [open, recipe]);

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
      open={open}
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
