import { useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EntityFormModal } from "../../components/EntityFormModal";
import { SortHeaders, useSortedRows } from "../../components/SortableTable";
import type { SortableColumn } from "../../components/SortableTable";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { TagChips } from "./RecipeChip";
import { cookLogFields, toCookLogBody } from "./recipeFields";
import { formatMinutes, totalMinutes } from "./labels";
import { recipesApi } from "./api";
import type { CookLog, Recipe, RecipeFavorite } from "./types";
import "./KitchenTab.css";

const columns: SortableColumn<CookLog>[] = [
  { key: "recipe", label: "Recipe", type: "text", value: (log) => log.recipe?.name ?? null },
  { key: "cookedAt", label: "Cooked", type: "date", value: (log) => log.cookedAt },
  { key: "rating", label: "Rating", type: "number", value: (log) => log.rating },
  { key: "notes", label: "Notes" },
];

function toDateInput(value: string): string {
  return value.slice(0, 10);
}

interface KitchenTabProps {
  recipes: Recipe[];
  favorites: RecipeFavorite[];
  cookLogs: CookLog[];
  favoriteIds: Set<string>;
  onFavoritesChanged: () => Promise<void>;
  onCookLogsChanged: () => Promise<void>;
}

export function KitchenTab({
  recipes,
  favorites,
  cookLogs,
  favoriteIds,
  onFavoritesChanged,
  onCookLogsChanged,
}: KitchenTabProps) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CookLog | null>(null);
  const [deleting, setDeleting] = useState<CookLog | null>(null);

  const { sorted: visible, sort, setSort } = useSortedRows(cookLogs, columns);

  const viewing = recipes.find((recipe) => recipe.id === viewingId) ?? null;

  async function toggleFavorite(recipeId: string) {
    if (favoriteIds.has(recipeId)) await recipesApi.removeFavorite(recipeId);
    else await recipesApi.addFavorite(recipeId);
    await onFavoritesChanged();
  }

  async function handleUpdate(values: Partial<CookLog>) {
    if (!editing) return;
    await recipesApi.updateCookLog(editing.id, toCookLogBody(values));
    await onCookLogsChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await recipesApi.deleteCookLog(deleting.id);
    await onCookLogsChanged();
  }

  return (
    <div className="kitchen-tab">
      <RecipeDetailModal
        recipe={viewing}
        onClose={() => setViewingId(null)}
        isFavorite={viewing ? favoriteIds.has(viewing.id) : false}
        onToggleFavorite={() => (viewing ? toggleFavorite(viewing.id) : Promise.resolve())}
        onCookLogged={onCookLogsChanged}
      />

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Cook Log"
        fields={cookLogFields}
        initialValues={
          editing
            ? {
                cookedAt: toDateInput(editing.cookedAt),
                rating: editing.rating,
                notes: editing.notes ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Cook Log"
        message={
          deleting
            ? `Remove the ${toDateInput(deleting.cookedAt)} entry for ${deleting.recipe?.name ?? "this recipe"}?`
            : ""
        }
        confirmLabel="Delete"
        danger
      />

      <section>
        <h2 className="kitchen-heading">Favourites</h2>
        {favorites.length === 0 ? (
          <p className="kitchen-empty">
            Star a recipe from Browse and it will show up here.
          </p>
        ) : (
          <div className="favorite-grid">
            {favorites.map((favorite) => {
              const recipe = favorite.recipe;
              if (!recipe) return null;
              return (
                <button
                  key={favorite.id}
                  type="button"
                  className="favorite-card"
                  onClick={() => setViewingId(recipe.id)}
                >
                  <span className="favorite-card-name">{recipe.name}</span>
                  <span className="favorite-card-meta">
                    {formatMinutes(totalMinutes(recipe))} · serves {recipe.servings}
                  </span>
                  <TagChips tags={recipe.tags} limit={3} />
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="kitchen-heading">Cook log</h2>
        {cookLogs.length === 0 ? (
          <p className="kitchen-empty">
            Nothing logged yet — open a recipe and hit "Log Cook" after you make it.
          </p>
        ) : (
          <table>
            <thead>
              <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
                <th></th>
              </SortHeaders>
            </thead>
            <tbody>
              {visible.map((log) => (
                <tr key={log.id}>
                  <td>{log.recipe?.name ?? "—"}</td>
                  <td>{toDateInput(log.cookedAt)}</td>
                  <td className="kitchen-rating">
                    {log.rating ? "★".repeat(log.rating) : "—"}
                  </td>
                  <td>{log.notes ?? "—"}</td>
                  <td className="kitchen-actions">
                    <button type="button" className="link-button" onClick={() => setEditing(log)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button danger"
                      onClick={() => setDeleting(log)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
