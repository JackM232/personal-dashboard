import { Modal } from "../../components/Modal";
import { RecipeDetail } from "./RecipeDetail";
import type { Recipe } from "./types";

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => Promise<void>;
  onCookLogged: () => Promise<void>;
}

// The modal presentation of RecipeDetail. `/recipes/:id` renders the same
// component full-page — see RecipeDetailPage.
export function RecipeDetailModal({
  recipe,
  onClose,
  isFavorite,
  onToggleFavorite,
  onCookLogged,
}: RecipeDetailModalProps) {
  return (
    <Modal open={recipe !== null} onClose={onClose} title={recipe?.name ?? ""} size="wide">
      {recipe && (
        <RecipeDetail
          // Remount on recipe change so the servings scaler and tick-offs reset.
          key={recipe.id}
          recipe={recipe}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onCookLogged={onCookLogged}
        />
      )}
    </Modal>
  );
}
