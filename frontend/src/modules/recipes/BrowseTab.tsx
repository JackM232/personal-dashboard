import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { Chip, DifficultyChip, TagChips } from "./RecipeChip";
import { ContentEditor } from "./ContentEditor";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { RecipeFormModal } from "./RecipeFormModal";
import {
  ALL_TAGS,
  CUISINES,
  DIFFICULTIES,
  MEAL_TYPES,
  formatMinutes,
  humanize,
  totalMinutes,
} from "./labels";
import { recipesApi } from "./api";
import type { Cuisine, MealType, Recipe, RecipeDifficulty, RecipeTag } from "./types";
import "./BrowseTab.css";

const columns: SortableColumn<Recipe>[] = [
  { key: "name", label: "Recipe", type: "text", value: (r) => r.name },
  { key: "mealType", label: "Meal", type: "enum", value: (r) => r.mealType, options: MEAL_TYPES },
  { key: "cuisine", label: "Cuisine", type: "enum", value: (r) => r.cuisine, options: CUISINES },
  { key: "time", label: "Time", type: "number", value: (r) => totalMinutes(r) },
  {
    key: "difficulty",
    label: "Difficulty",
    type: "enum",
    value: (r) => r.difficulty,
    options: DIFFICULTIES,
  },
  { key: "protein", label: "Protein", type: "number", value: (r) => r.proteinGrams },
  { key: "ingredients", label: "Ingredients", type: "number", value: (r) => r.ingredients.length },
  { key: "tags", label: "Tags" },
];

// "What can I make in the next half hour" is the question this table exists to
// answer, so time gets first-class filtering rather than sort-only.
const TIME_LIMITS = [15, 30, 45, 60, 90];

type Filter<T> = T | "ALL";

interface BrowseTabProps {
  recipes: Recipe[];
  favoriteIds: Set<string>;
  onRecipesChanged: () => Promise<void>;
  onFavoritesChanged: () => Promise<void>;
  onCookLogged: () => Promise<void>;
  canManage: boolean;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function BrowseTab({
  recipes,
  favoriteIds,
  onRecipesChanged,
  onFavoritesChanged,
  onCookLogged,
  canManage,
  addOpen,
  onAddOpenChange,
}: BrowseTabProps) {
  const [search, setSearch] = useState("");
  const [meal, setMeal] = useState<Filter<MealType>>("ALL");
  const [cuisine, setCuisine] = useState<Filter<Cuisine>>("ALL");
  const [difficulty, setDifficulty] = useState<Filter<RecipeDifficulty>>("ALL");
  const [tag, setTag] = useState<Filter<RecipeTag>>("ALL");
  const [maxTime, setMaxTime] = useState<Filter<number>>("ALL");

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [editingContent, setEditingContent] = useState<Recipe | null>(null);
  const [deleting, setDeleting] = useState<Recipe | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (meal !== "ALL" && recipe.mealType !== meal) return false;
      if (cuisine !== "ALL" && recipe.cuisine !== cuisine) return false;
      if (difficulty !== "ALL" && recipe.difficulty !== difficulty) return false;
      if (tag !== "ALL" && !recipe.tags.includes(tag)) return false;
      if (maxTime !== "ALL" && totalMinutes(recipe) > maxTime) return false;
      if (!query) return true;
      // Searching ingredients is what turns this into "what can I do with the
      // chickpeas in the cupboard".
      return (
        recipe.name.toLowerCase().includes(query) ||
        (recipe.description ?? "").toLowerCase().includes(query) ||
        recipe.ingredients.some((ingredient) => ingredient.name.toLowerCase().includes(query))
      );
    });
  }, [recipes, search, meal, cuisine, difficulty, tag, maxTime]);

  const { sorted: visible, sort, setSort } = useSortedRows(filtered, columns);

  // Kept as an id rather than the row itself so an edit elsewhere refreshes the
  // open popup instead of leaving it stale.
  const viewing = recipes.find((recipe) => recipe.id === viewingId) ?? null;

  async function toggleFavorite(recipeId: string) {
    if (favoriteIds.has(recipeId)) await recipesApi.removeFavorite(recipeId);
    else await recipesApi.addFavorite(recipeId);
    await onFavoritesChanged();
  }

  async function handleCreate(body: Partial<Recipe>) {
    await recipesApi.createRecipe(body);
    await onRecipesChanged();
  }

  async function handleUpdate(body: Partial<Recipe>) {
    if (!editing) return;
    await recipesApi.updateRecipe(editing.id, body);
    await onRecipesChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await recipesApi.deleteRecipe(deleting.id);
    await onRecipesChanged();
  }

  const filtersActive =
    Boolean(search.trim()) ||
    [meal, cuisine, difficulty, tag, maxTime].some((value) => value !== "ALL");

  function clearFilters() {
    setSearch("");
    setMeal("ALL");
    setCuisine("ALL");
    setDifficulty("ALL");
    setTag("ALL");
    setMaxTime("ALL");
  }

  return (
    <div>
      <div className="recipes-filters">
        <label className="recipes-search">
          Search
          <input
            type="search"
            placeholder="Name or ingredient"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <label>
          Meal
          <select value={meal} onChange={(e) => setMeal(e.target.value as Filter<MealType>)}>
            <option value="ALL">All</option>
            {MEAL_TYPES.map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Cuisine
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value as Filter<Cuisine>)}
          >
            <option value="ALL">All</option>
            {CUISINES.map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Difficulty
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Filter<RecipeDifficulty>)}
          >
            <option value="ALL">All</option>
            {DIFFICULTIES.map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tag
          <select value={tag} onChange={(e) => setTag(e.target.value as Filter<RecipeTag>)}>
            <option value="ALL">Any</option>
            {ALL_TAGS.map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ready in
          <select
            value={String(maxTime)}
            onChange={(e) =>
              setMaxTime(e.target.value === "ALL" ? "ALL" : Number(e.target.value))
            }
          >
            <option value="ALL">Any time</option>
            {TIME_LIMITS.map((limit) => (
              <option key={limit} value={limit}>
                ≤ {formatMinutes(limit)}
              </option>
            ))}
          </select>
        </label>

        {filtersActive && (
          <button type="button" className="link-button recipes-clear" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      <p className="recipes-count">
        {visible.length} of {recipes.length} recipes
      </p>

      <RecipeDetailModal
        recipe={viewing}
        onClose={() => setViewingId(null)}
        isFavorite={viewing ? favoriteIds.has(viewing.id) : false}
        onToggleFavorite={() => (viewing ? toggleFavorite(viewing.id) : Promise.resolve())}
        onCookLogged={onCookLogged}
      />

      {canManage && (
        <>
          <RecipeFormModal
            open={addOpen}
            onClose={() => onAddOpenChange(false)}
            onSubmit={handleCreate}
          />

          <RecipeFormModal
            open={editing !== null}
            onClose={() => setEditing(null)}
            recipe={editing}
            onSubmit={handleUpdate}
          />

          <ContentEditor
            recipe={editingContent}
            onClose={() => setEditingContent(null)}
            onSaved={onRecipesChanged}
          />

          <ConfirmDialog
            open={deleting !== null}
            onClose={() => setDeleting(null)}
            onConfirm={handleDelete}
            title="Delete Recipe"
            message={
              deleting ? `Delete ${deleting.name}? This cannot be undone.` : ""
            }
            confirmLabel="Delete"
            danger
          />
        </>
      )}

      {visible.length === 0 ? (
        <p>{recipes.length === 0 ? "No recipes yet." : "No recipes match these filters."}</p>
      ) : (
        <table className="recipes-table">
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              <th></th>
            </SortHeaders>
          </thead>
          <tbody>
            {visible.map((recipe) => (
              <tr key={recipe.id}>
                <td>
                  <button
                    type="button"
                    className="recipe-name-button"
                    onClick={() => setViewingId(recipe.id)}
                  >
                    {favoriteIds.has(recipe.id) && <span className="recipe-star">★</span>}
                    {recipe.name}
                  </button>
                  {recipe.description && (
                    <span className="recipe-subline">{recipe.description}</span>
                  )}
                </td>
                <td>
                  <Chip label={humanize(recipe.mealType)} tone="meal" />
                </td>
                <td>{humanize(recipe.cuisine)}</td>
                <td>{formatMinutes(totalMinutes(recipe))}</td>
                <td>
                  <DifficultyChip difficulty={recipe.difficulty} />
                </td>
                <td>{recipe.proteinGrams === null ? "—" : `${recipe.proteinGrams}g`}</td>
                <td>
                  {recipe.ingredients.length}
                  <span className="recipe-subline">
                    {recipe.ingredients
                      .slice(0, 3)
                      .map((ingredient) => ingredient.name)
                      .join(", ")}
                  </span>
                </td>
                <td>
                  <TagChips tags={recipe.tags} limit={3} />
                </td>
                <td className="recipes-actions">
                  <Link className="link-button" to={`/recipes/${recipe.id}`}>
                    Open
                  </Link>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setEditing(recipe)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setEditingContent(recipe)}
                      >
                        Content
                      </button>
                      <button
                        type="button"
                        className="link-button danger"
                        onClick={() => setDeleting(recipe)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
