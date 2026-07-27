import { useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { queries } from "../../api/queries";
import { useAuth } from "../../auth/AuthContext";
import { CONTRIBUTOR_ROLES, hasRole } from "../../auth/roles";
import { BrowseTab } from "./BrowseTab";
import { KitchenTab } from "./KitchenTab";
import { RecipeDetailPage } from "./RecipeDetailPage";
import type { CookLog, Recipe, RecipeFavorite } from "./types";
import "./RecipesPage.css";

type Tab = "browse" | "kitchen";

// The module owns its own routes — see `nested` in the module registry.
export function RecipesPage() {
  return (
    <Routes>
      <Route index element={<RecipesHome />} />
      <Route path=":id" element={<RecipeDetailPage />} />
    </Routes>
  );
}

function RecipesHome() {
  const { user } = useAuth();
  const canManage = hasRole(user, ...CONTRIBUTOR_ROLES);

  const [tab, setTab] = useState<Tab>("browse");
  const [addRecipeOpen, setAddRecipeOpen] = useState(false);
  const queryClient = useQueryClient();

  const recipesQuery = useQuery(queries.recipes);
  const cookLogsQuery = useQuery(queries.cookLogs);
  const favoritesQuery = useQuery(queries.recipeFavorites);

  function loadRecipes() {
    // An edit here also changes what /recipes/:id shows for that recipe.
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.list }),
      queryClient.invalidateQueries({ queryKey: ["recipes", "detail"] }),
    ]).then(() => {});
  }

  function loadCookLogs() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.recipes.cookLogs });
  }

  function loadFavorites() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.recipes.favorites });
  }

  const recipes: Recipe[] = recipesQuery.data ?? [];
  const cookLogs: CookLog[] = cookLogsQuery.data ?? [];
  const favorites: RecipeFavorite[] = favoritesQuery.data ?? [];
  const error = recipesQuery.error ?? cookLogsQuery.error ?? favoritesQuery.error;

  // Both tabs ask "is this one starred?" per row; a set beats scanning the list.
  // Keyed off the query data itself — the `?? []` fallback is a fresh array each
  // render and would defeat the memo.
  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((favorite) => favorite.recipeId)),
    [favoritesQuery.data],
  );

  if (recipesQuery.isPending || cookLogsQuery.isPending || favoritesQuery.isPending) {
    return <p>Loading...</p>;
  }
  if (error) return <p>Failed to load: {error.message}</p>;

  return (
    <div>
      <div className="recipes-header">
        <h1>Recipes</h1>
      </div>

      <div className="recipes-tabs">
        <div className="recipes-tabs-list">
          <button
            type="button"
            className={`recipes-tab ${tab === "browse" ? "active" : ""}`}
            onClick={() => setTab("browse")}
          >
            Browse
          </button>
          <button
            type="button"
            className={`recipes-tab ${tab === "kitchen" ? "active" : ""}`}
            onClick={() => setTab("kitchen")}
          >
            My Kitchen
          </button>
        </div>

        {tab === "browse" && canManage && (
          <button type="button" className="add-button" onClick={() => setAddRecipeOpen(true)}>
            Add Recipe
          </button>
        )}
      </div>

      {tab === "browse" ? (
        <BrowseTab
          recipes={recipes}
          favoriteIds={favoriteIds}
          onRecipesChanged={loadRecipes}
          onFavoritesChanged={loadFavorites}
          onCookLogged={loadCookLogs}
          canManage={canManage}
          addOpen={addRecipeOpen}
          onAddOpenChange={setAddRecipeOpen}
        />
      ) : (
        <KitchenTab
          recipes={recipes}
          favorites={favorites}
          cookLogs={cookLogs}
          favoriteIds={favoriteIds}
          onFavoritesChanged={loadFavorites}
          onCookLogsChanged={loadCookLogs}
        />
      )}
    </div>
  );
}
