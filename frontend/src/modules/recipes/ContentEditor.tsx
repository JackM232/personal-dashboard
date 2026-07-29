import { useState } from "react";
import { Modal } from "../../components/Modal";
import { UNITS, humanize } from "./labels";
import { recipesApi } from "./api";
import type { IngredientInput, MeasurementUnit, Recipe, StepInput } from "./types";
import "./ContentEditor.css";

interface ContentEditorProps {
  recipe: Recipe | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

interface ContentEditorFormProps {
  recipe: Recipe;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const EMPTY_INGREDIENT: IngredientInput = { quantity: null, unit: null, name: "", note: null };
const EMPTY_STEP: StepInput = { instruction: "", minutes: null };

// Ingredients and steps are edited together and saved together — they're two
// halves of one document, and EntityFormModal has no field type for lists.
// Modal doesn't render its children while closed, so this only ever mounts
// once a recipe is set — that's what re-seeds `ingredients`/`steps` per
// recipe without an effect.
function ContentEditorForm({ recipe, onClose, onSaved }: ContentEditorFormProps) {
  const [ingredients, setIngredients] = useState<IngredientInput[]>(() =>
    recipe.ingredients.map((row) => ({
      quantity: row.quantity,
      unit: row.unit,
      name: row.name,
      note: row.note,
    })),
  );
  const [steps, setSteps] = useState<StepInput[]>(() =>
    recipe.steps.map((row) => ({ instruction: row.instruction, minutes: row.minutes })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function move<T>(rows: T[], index: number, delta: number): T[] {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return rows;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Blank trailing rows are an artifact of the "Add" buttons, not intent.
      await recipesApi.replaceIngredients(
        recipe.id,
        ingredients.filter((row) => row.name.trim()),
      );
      await recipesApi.replaceSteps(
        recipe.id,
        steps.filter((row) => row.instruction.trim()),
      );
      await onSaved();
      onClose();
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-editor">
      <section>
        <div className="content-editor-head">
          <h3>Ingredients</h3>
          <button
            type="button"
            className="link-button"
            onClick={() => setIngredients((rows) => [...rows, { ...EMPTY_INGREDIENT }])}
          >
            + Add ingredient
          </button>
        </div>

        {ingredients.map((row, index) => (
          <div key={index} className="editor-row">
            <input
              className="editor-quantity"
              type="number"
              step="any"
              min="0"
              placeholder="Qty"
              value={row.quantity ?? ""}
              onChange={(e) =>
                setIngredients((rows) =>
                  rows.map((r, i) =>
                    i === index
                      ? { ...r, quantity: e.target.value === "" ? null : Number(e.target.value) }
                      : r,
                  ),
                )
              }
            />
            <select
              className="editor-unit"
              value={row.unit ?? ""}
              onChange={(e) =>
                setIngredients((rows) =>
                  rows.map((r, i) =>
                    i === index
                      ? { ...r, unit: (e.target.value || null) as MeasurementUnit | null }
                      : r,
                  ),
                )
              }
            >
              <option value="">unit</option>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {humanize(unit) || unit.toLowerCase()}
                </option>
              ))}
            </select>
            <input
              className="editor-name"
              type="text"
              placeholder="Ingredient"
              value={row.name}
              onChange={(e) =>
                setIngredients((rows) =>
                  rows.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
                )
              }
            />
            <input
              className="editor-note"
              type="text"
              placeholder="Note (diced, room temp…)"
              value={row.note ?? ""}
              onChange={(e) =>
                setIngredients((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, note: e.target.value || null } : r,
                  ),
                )
              }
            />
            <RowControls
              index={index}
              count={ingredients.length}
              onMove={(delta) => setIngredients((rows) => move(rows, index, delta))}
              onRemove={() => setIngredients((rows) => rows.filter((_, i) => i !== index))}
            />
          </div>
        ))}
      </section>

      <section>
        <div className="content-editor-head">
          <h3>Steps</h3>
          <button
            type="button"
            className="link-button"
            onClick={() => setSteps((rows) => [...rows, { ...EMPTY_STEP }])}
          >
            + Add step
          </button>
        </div>

        {steps.map((row, index) => (
          <div key={index} className="editor-row editor-row-step">
            <span className="editor-step-number">{index + 1}</span>
            <textarea
              className="editor-instruction"
              rows={2}
              placeholder="What to do"
              value={row.instruction}
              onChange={(e) =>
                setSteps((rows) =>
                  rows.map((r, i) => (i === index ? { ...r, instruction: e.target.value } : r)),
                )
              }
            />
            <input
              className="editor-minutes"
              type="number"
              min="0"
              placeholder="min"
              value={row.minutes ?? ""}
              onChange={(e) =>
                setSteps((rows) =>
                  rows.map((r, i) =>
                    i === index
                      ? { ...r, minutes: e.target.value === "" ? null : Number(e.target.value) }
                      : r,
                  ),
                )
              }
            />
            <RowControls
              index={index}
              count={steps.length}
              onMove={(delta) => setSteps((rows) => move(rows, index, delta))}
              onRemove={() => setSteps((rows) => rows.filter((_, i) => i !== index))}
            />
          </div>
        ))}
      </section>

      {error && <p className="content-editor-error">{error}</p>}

      <div className="content-editor-actions">
        <button type="button" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="add-button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export function ContentEditor({ recipe, onClose, onSaved }: ContentEditorProps) {
  return (
    <Modal
      open={recipe !== null}
      onClose={onClose}
      title={recipe ? `Ingredients & steps — ${recipe.name}` : ""}
      size="wide"
    >
      {recipe && <ContentEditorForm recipe={recipe} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

interface RowControlsProps {
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
}

function RowControls({ index, count, onMove, onRemove }: RowControlsProps) {
  return (
    <span className="editor-controls">
      <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === count - 1}
        aria-label="Move down"
      >
        ↓
      </button>
      <button type="button" className="editor-remove" onClick={onRemove} aria-label="Remove">
        ×
      </button>
    </span>
  );
}
