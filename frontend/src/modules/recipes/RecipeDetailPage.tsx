import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { queries } from "../../api/queries";
import { RecipeDetail } from "./RecipeDetail";
import { recipesApi } from "./api";
import "./RecipeDetailPage.css";

// The deep-linkable form of a recipe. Fetches on its own rather than reading
// from the list, so a shared /recipes/:id URL works on a cold load.
export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const recipeQuery = useQuery({
    queryKey: queryKeys.recipes.detail(id!),
    queryFn: () => recipesApi.getRecipe(id!),
    enabled: Boolean(id),
  });
  // Shares its definition with the list page, so arriving from Browse — or from
  // the login prefetch — costs no fetch.
  const favoritesQuery = useQuery(queries.recipeFavorites);

  const isFavorite = (favoritesQuery.data ?? []).some((favorite) => favorite.recipeId === id);

  async function toggleFavorite() {
    if (!id) return;
    if (isFavorite) await recipesApi.removeFavorite(id);
    else await recipesApi.addFavorite(id);
    await queryClient.invalidateQueries({ queryKey: queryKeys.recipes.favorites });
  }

  const error = recipeQuery.error ?? favoritesQuery.error;

  if (!id) return <p>Recipe not found.</p>;
  if (recipeQuery.isPending || favoritesQuery.isPending) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error.message}</p>;
  if (!recipeQuery.data) return <p>Recipe not found.</p>;

  return (
    <div className="recipe-page">
      <Link className="recipe-back" to="/recipes">
        ← All recipes
      </Link>

      <RecipeDetail
        recipe={recipeQuery.data}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        onCookLogged={async () => {}}
      />
    </div>
  );
}
