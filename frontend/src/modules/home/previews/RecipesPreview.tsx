import { useQuery } from "@tanstack/react-query";
import { queries } from "../../../api/queries";
import { summarizeRecipes } from "../summaries";
import { formatShortDay } from "../labels";
import {
  PreviewFailed,
  PreviewHero,
  PreviewNote,
  PreviewRow,
  PreviewRows,
  PreviewSkeleton,
} from "../PreviewParts";

export function RecipesPreview() {
  const recipesQuery = useQuery(queries.recipes);
  const cookLogsQuery = useQuery(queries.cookLogs);
  const favoritesQuery = useQuery(queries.recipeFavorites);

  if (recipesQuery.isPending || cookLogsQuery.isPending || favoritesQuery.isPending) {
    return <PreviewSkeleton />;
  }
  if (recipesQuery.error || cookLogsQuery.error || favoritesQuery.error) return <PreviewFailed />;

  const summary = summarizeRecipes(
    recipesQuery.data ?? [],
    cookLogsQuery.data ?? [],
    favoritesQuery.data ?? [],
  );

  if (summary.recipeCount === 0) return <PreviewNote>No recipes yet.</PreviewNote>;

  return (
    <>
      <PreviewHero
        value={summary.cooksLast30Days}
        label={summary.cooksLast30Days === 1 ? "cook in the last 30 days" : "cooks in the last 30 days"}
      />

      <PreviewRows>
        <PreviewRow
          label="Last cooked"
          value={
            summary.lastCook
              ? `${summary.lastCookName ?? "A recipe"} · ${formatShortDay(summary.lastCook.cookedAt)}`
              : "Nothing cooked yet"
          }
        />
        <PreviewRow label="Favorites" value={summary.favorites} />
        <PreviewRow label="Recipes in the book" value={summary.recipeCount} />
      </PreviewRows>
    </>
  );
}
