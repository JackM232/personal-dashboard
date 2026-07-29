import { useState } from "react";
import type { FormEvent } from "react";
import { gymApi } from "../../api/gym";
import type { WorkoutExercise } from "../../api/gym";
import { Modal } from "../../components/Modal";
import "./SetEditor.css";

// Blank weight means bodyweight/unloaded and is sent as null, never 0 — the
// inputs stay strings until save so a half-typed value doesn't fight the user.
interface SetDraft {
  reps: string;
  weight: string;
  isWarmup: boolean;
}

const EMPTY_SET: SetDraft = { reps: "", weight: "", isWarmup: false };

function toDrafts(workoutExercise: WorkoutExercise): SetDraft[] {
  if (workoutExercise.sets.length === 0) return [{ ...EMPTY_SET }];
  return workoutExercise.sets.map((set) => ({
    reps: String(set.reps),
    weight: set.weight === null ? "" : String(set.weight),
    isWarmup: set.isWarmup,
  }));
}

interface SetEditorProps {
  open: boolean;
  onClose: () => void;
  workoutExercise: WorkoutExercise | null;
  onSaved: () => Promise<void>;
}

interface SetEditorFormProps {
  workoutExercise: WorkoutExercise;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

// Modal doesn't render its children while closed, so this only ever mounts
// once a workoutExercise is set — that's what re-seeds `drafts` per exercise
// without an effect.
function SetEditorForm({ workoutExercise, onClose, onSaved }: SetEditorFormProps) {
  const [drafts, setDrafts] = useState<SetDraft[]>(() => toDrafts(workoutExercise));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDraft(index: number, patch: Partial<SetDraft>) {
    setDrafts((prev) => prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)));
  }

  function addSet() {
    setDrafts((prev) => [...prev, { ...EMPTY_SET }]);
  }

  function duplicateLast() {
    setDrafts((prev) => (prev.length === 0 ? [{ ...EMPTY_SET }] : [...prev, { ...prev[prev.length - 1] }]));
  }

  function removeSet(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Mirrors the server's rules so the common mistake costs no round-trip;
    // the server is still authoritative.
    const sets = [];
    for (const [index, draft] of drafts.entries()) {
      const reps = Number(draft.reps);
      if (!Number.isInteger(reps) || reps <= 0) {
        setError(`Set ${index + 1}: reps must be a whole number greater than 0`);
        return;
      }

      const trimmedWeight = draft.weight.trim();
      const weight = trimmedWeight === "" ? null : Number(trimmedWeight);
      if (weight !== null && (!Number.isFinite(weight) || weight < 0)) {
        setError(`Set ${index + 1}: weight must be 0 or more, or blank for bodyweight`);
        return;
      }

      sets.push({ reps, weight, isWarmup: draft.isWarmup });
    }

    setSubmitting(true);
    setError(null);
    try {
      await gymApi.replaceSets(workoutExercise.id, sets);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="set-editor-rows">
        <div className="set-editor-head">
          <span>#</span>
          <span>Reps</span>
          <span>Weight (lb)</span>
          <span>Warmup</span>
          <span></span>
        </div>

        {drafts.length === 0 ? (
          <p className="set-editor-empty">No sets — saving now clears this exercise.</p>
        ) : (
          drafts.map((draft, index) => (
            <div key={index} className="set-editor-row">
              <span className="set-editor-number">{index + 1}</span>
              <input
                type="number"
                min="1"
                step="1"
                value={draft.reps}
                onChange={(e) => updateDraft(index, { reps: e.target.value })}
                aria-label={`Set ${index + 1} reps`}
              />
              <input
                type="number"
                min="0"
                step="any"
                placeholder="BW"
                value={draft.weight}
                onChange={(e) => updateDraft(index, { weight: e.target.value })}
                aria-label={`Set ${index + 1} weight`}
              />
              <input
                type="checkbox"
                checked={draft.isWarmup}
                onChange={(e) => updateDraft(index, { isWarmup: e.target.checked })}
                aria-label={`Set ${index + 1} is a warmup`}
              />
              <button
                type="button"
                className="link-button danger"
                onClick={() => removeSet(index)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      <div className="set-editor-tools">
        <button type="button" onClick={addSet}>
          Add set
        </button>
        <button type="button" onClick={duplicateLast} disabled={drafts.length === 0}>
          Duplicate last set
        </button>
      </div>

      {error && <p className="entity-form-error">{error}</p>}

      <div className="entity-form-actions">
        <button type="button" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? "Saving..." : "Save sets"}
        </button>
      </div>
    </form>
  );
}

export function SetEditor({ open, onClose, workoutExercise, onSaved }: SetEditorProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={workoutExercise ? `Sets — ${workoutExercise.exercise.name}` : "Sets"}
    >
      {workoutExercise && (
        <SetEditorForm workoutExercise={workoutExercise} onClose={onClose} onSaved={onSaved} />
      )}
    </Modal>
  );
}
