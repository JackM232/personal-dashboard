import { useMemo, useState } from "react";
import { EntityFormModal } from "../../components/EntityFormModal";
import { Chip, DifficultyChip, TagChips } from "./RecipeChip";
import { cookLogFields, toCookLogBody } from "./recipeFields";
import { formatMinutes, humanize, ingredientText, totalMinutes } from "./labels";
import { recipesApi } from "./api";
import type { CookLog, Recipe } from "./types";
import "./RecipeDetail.css";

interface RecipeDetailProps {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: () => Promise<void>;
  onCookLogged: () => Promise<void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RecipeDetail({
  recipe,
  isFavorite,
  onToggleFavorite,
  onCookLogged,
}: RecipeDetailProps) {
  // Everything below is deliberately unpersisted session state — scaling and
  // ticking things off belong to this one cooking session, not to the recipe.
  const [servings, setServings] = useState(recipe.servings);
  const [gathered, setGathered] = useState<Set<string>>(new Set());
  const [doneSteps, setDoneSteps] = useState<Set<string>>(new Set());
  const [logOpen, setLogOpen] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  const scale = servings / recipe.servings;
  const total = totalMinutes(recipe);

  const macros = useMemo(
    () =>
      [
        { label: "Calories", value: recipe.calories, suffix: "" },
        { label: "Protein", value: recipe.proteinGrams, suffix: "g" },
        { label: "Carbs", value: recipe.carbGrams, suffix: "g" },
        { label: "Fat", value: recipe.fatGrams, suffix: "g" },
      ].filter((macro) => macro.value !== null),
    [recipe],
  );

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  async function handleFavorite() {
    setFavoriteBusy(true);
    try {
      await onToggleFavorite();
    }
    finally {
      setFavoriteBusy(false);
    }
  }

  async function handleLogCook(values: Partial<CookLog>) {
    await recipesApi.createCookLog({ ...toCookLogBody(values), recipeId: recipe.id });
    await onCookLogged();
  }

  return (
    <article className="recipe-detail">
      <header className="recipe-detail-header">
        <div className="recipe-detail-heading">
          <h2>{recipe.name}</h2>
          <button
            type="button"
            className={`recipe-favorite ${isFavorite ? "active" : ""}`}
            onClick={handleFavorite}
            disabled={favoriteBusy}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>

        {recipe.description && <p className="recipe-detail-description">{recipe.description}</p>}

        <div className="recipe-chip-row">
          <Chip label={humanize(recipe.mealType)} tone="meal" />
          <Chip label={humanize(recipe.cuisine)} tone="muted" />
          <DifficultyChip difficulty={recipe.difficulty} />
          <TagChips tags={recipe.tags} />
        </div>
      </header>

      <section className="recipe-stats" aria-label="Timing and nutrition">
        <Stat label="Prep" value={formatMinutes(recipe.prepMinutes)} />
        <Stat label="Cook" value={formatMinutes(recipe.cookMinutes)} />
        <Stat label="Total" value={formatMinutes(total)} emphasis />
        <Stat label="Serves" value={String(recipe.servings)} />
        {macros.map((macro) => (
          <Stat key={macro.label} label={macro.label} value={`${macro.value}${macro.suffix}`} muted />
        ))}
      </section>

      <div className="recipe-body">
        <section className="recipe-ingredients" aria-label="Ingredients">
          <div className="recipe-section-head">
            <h3>Ingredients</h3>
            <div className="serving-scaler">
              <button
                type="button"
                onClick={() => setServings((n) => Math.max(1, n - 1))}
                disabled={servings <= 1}
                aria-label="Fewer servings"
              >
                −
              </button>
              <span>
                {servings} {servings === 1 ? "serving" : "servings"}
              </span>
              <button
                type="button"
                onClick={() => setServings((n) => Math.min(50, n + 1))}
                aria-label="More servings"
              >
                +
              </button>
            </div>
          </div>

          {scale !== 1 && (
            <p className="recipe-scale-note">Scaled from {recipe.servings}</p>
          )}

          {recipe.ingredients.length === 0 ? (
            <p className="recipe-empty">No ingredients listed yet.</p>
          ) : (
            <ul className="ingredient-list">
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id}>
                  <label className={gathered.has(ingredient.id) ? "gathered" : ""}>
                    <input
                      type="checkbox"
                      checked={gathered.has(ingredient.id)}
                      onChange={() => setGathered((set) => toggle(set, ingredient.id))}
                    />
                    <span className="ingredient-text">
                      {ingredientText(ingredient, scale)}
                      {ingredient.note && (
                        <span className="ingredient-note">{ingredient.note}</span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="recipe-steps" aria-label="Instructions">
          <div className="recipe-section-head">
            <h3>Instructions</h3>
            {doneSteps.size > 0 && (
              <button type="button" className="link-button" onClick={() => setDoneSteps(new Set())}>
                Reset progress
              </button>
            )}
          </div>

          {recipe.steps.length === 0 ? (
            <p className="recipe-empty">No instructions written yet.</p>
          ) : (
            <ol className="step-list">
              {recipe.steps.map((step, index) => (
                <li key={step.id} className={doneSteps.has(step.id) ? "done" : ""}>
                  {/* The whole row is the toggle — mid-cook, precision clicking
                      on a small checkbox is the last thing anyone wants. */}
                  <button
                    type="button"
                    className="step-row"
                    onClick={() => setDoneSteps((set) => toggle(set, step.id))}
                    aria-pressed={doneSteps.has(step.id)}
                  >
                    <span className="step-number">{index + 1}</span>
                    <span className="step-text">
                      {step.instruction}
                      {step.minutes !== null && (
                        <span className="step-minutes">{formatMinutes(step.minutes)}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <footer className="recipe-detail-footer">
        <button type="button" className="add-button" onClick={() => setLogOpen(true)}>
          Log Cook
        </button>
        {recipe.sourceUrl && (
          <a className="recipe-source" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
            Original source ↗
          </a>
        )}
      </footer>

      <EntityFormModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title={`Log ${recipe.name}`}
        fields={cookLogFields}
        initialValues={{ cookedAt: today(), rating: null, notes: "" }}
        onSubmit={handleLogCook}
        submitLabel="Log it"
      />
    </article>
  );
}

interface StatProps {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}

function Stat({ label, value, emphasis, muted }: StatProps) {
  return (
    <div className={`recipe-stat ${emphasis ? "emphasis" : ""} ${muted ? "muted" : ""}`}>
      <span className="recipe-stat-value">{value}</span>
      <span className="recipe-stat-label">{label}</span>
    </div>
  );
}
