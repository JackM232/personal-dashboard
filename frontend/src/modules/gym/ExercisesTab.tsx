import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { gymApi } from "../../api/gym";
import type { EquipmentType, Exercise, MuscleGroup } from "../../api/gym";
import { Modal } from "../../components/Modal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { MuscleMultiSelect } from "./MuscleMultiSelect";
import { EQUIPMENT_LABELS, EQUIPMENT_TYPES, MUSCLE_LABELS } from "./muscles";

const columns: SortableColumn<Exercise>[] = [
  { key: "name", label: "Name", type: "text", value: (e) => e.name },
  {
    key: "equipment",
    label: "Equipment",
    type: "enum",
    value: (e) => e.equipment,
    options: EQUIPMENT_TYPES,
  },
  { key: "primaryMuscles", label: "Primary Muscles" },
  { key: "secondaryMuscles", label: "Secondary Muscles" },
];

interface ExerciseFormValues {
  name: string;
  equipment: EquipmentType;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  isUnilateral: boolean;
  description: string;
}

const EMPTY_FORM: ExerciseFormValues = {
  name: "",
  equipment: "BARBELL",
  primaryMuscles: [],
  secondaryMuscles: [],
  isUnilateral: false,
  description: "",
};

function MuscleChips({ muscles }: { muscles: MuscleGroup[] }) {
  if (muscles.length === 0) return <span className="gym-muted">—</span>;
  return (
    <span className="gym-chips">
      {muscles.map((muscle) => (
        <span key={muscle} className="gym-chip">
          {MUSCLE_LABELS[muscle]}
        </span>
      ))}
    </span>
  );
}

interface ExerciseFormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  initialValues?: ExerciseFormValues;
  onSubmit: (values: ExerciseFormValues) => Promise<void>;
  submitLabel: string;
}

// A local form rather than EntityFormModal: the two muscle fields are
// multi-selects, which FieldConfig cannot express. The .entity-form* classes
// keep it visually identical to every other form in the app.
function ExerciseFormModal({
  open,
  onClose,
  title,
  initialValues,
  onSubmit,
  submitLabel,
}: ExerciseFormModalProps) {
  const [values, setValues] = useState<ExerciseFormValues>(initialValues ?? EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed on open, so editing a different exercise reflects that row.
  useEffect(() => {
    if (!open) return;
    setValues(initialValues ?? EMPTY_FORM);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialValues]);

  function setField<K extends keyof ExerciseFormValues>(key: K, value: ExerciseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (values.primaryMuscles.length === 0) {
      setError("Pick at least one primary muscle");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form className="entity-form" onSubmit={handleSubmit}>
        <label className="entity-form-field">
          <span>Name</span>
          <input
            type="text"
            value={values.name}
            required
            onChange={(e) => setField("name", e.target.value)}
          />
        </label>

        <label className="entity-form-field">
          <span>Equipment</span>
          <select
            value={values.equipment}
            onChange={(e) => setField("equipment", e.target.value as EquipmentType)}
          >
            {EQUIPMENT_TYPES.map((equipment) => (
              <option key={equipment} value={equipment}>
                {EQUIPMENT_LABELS[equipment]}
              </option>
            ))}
          </select>
        </label>

        <MuscleMultiSelect
          label="Primary Muscles"
          value={values.primaryMuscles}
          onChange={(muscles) =>
            setValues((prev) => ({
              ...prev,
              primaryMuscles: muscles,
              // Promoting a muscle to primary drops it from secondary.
              secondaryMuscles: prev.secondaryMuscles.filter((m) => !muscles.includes(m)),
            }))
          }
        />

        <MuscleMultiSelect
          label="Secondary Muscles"
          value={values.secondaryMuscles}
          onChange={(muscles) => setField("secondaryMuscles", muscles)}
          disabled={values.primaryMuscles}
          hint="Muscles already marked primary can't also be secondary."
        />

        <label className="entity-form-field">
          <span>Unilateral</span>
          <input
            type="checkbox"
            checked={values.isUnilateral}
            onChange={(e) => setField("isUnilateral", e.target.checked)}
          />
        </label>

        <label className="entity-form-field">
          <span>Description</span>
          <input
            type="text"
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </label>

        {error && <p className="entity-form-error">{error}</p>}

        <div className="entity-form-actions">
          <button type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface ExercisesTabProps {
  exercises: Exercise[];
  canManageExercises: boolean;
  onExercisesChanged: () => Promise<void>;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function ExercisesTab({
  exercises,
  canManageExercises,
  onExercisesChanged,
  addOpen,
  onAddOpenChange,
}: ExercisesTabProps) {
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);

  const { sorted: visible, sort, setSort } = useSortedRows(exercises, columns);

  async function handleCreate(values: ExerciseFormValues) {
    await gymApi.createExercise({ ...values, description: values.description || null });
    await onExercisesChanged();
  }

  async function handleUpdate(values: ExerciseFormValues) {
    if (!editing) return;
    await gymApi.updateExercise(editing.id, {
      ...values,
      description: values.description || null,
    });
    await onExercisesChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await gymApi.deleteExercise(deleting.id);
    await onExercisesChanged();
  }

  return (
    <div>
      <ExerciseFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Add Exercise"
        onSubmit={handleCreate}
        submitLabel="Add"
      />

      <ExerciseFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Exercise"
        initialValues={
          editing
            ? {
                name: editing.name,
                equipment: editing.equipment,
                primaryMuscles: editing.primaryMuscles,
                secondaryMuscles: editing.secondaryMuscles,
                isUnilateral: editing.isUnilateral,
                description: editing.description ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
        submitLabel="Save"
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Exercise"
        message={
          deleting
            ? `Delete ${deleting.name} from the catalog? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
      />

      {visible.length === 0 ? (
        <p>No exercises in the catalog yet.</p>
      ) : (
        <table>
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              {canManageExercises && <th></th>}
            </SortHeaders>
          </thead>
          <tbody>
            {visible.map((exercise) => (
              <tr key={exercise.id}>
                <td>{exercise.name}</td>
                <td>{EQUIPMENT_LABELS[exercise.equipment]}</td>
                <td>
                  <MuscleChips muscles={exercise.primaryMuscles} />
                </td>
                <td>
                  <MuscleChips muscles={exercise.secondaryMuscles} />
                </td>
                {canManageExercises && (
                  <td className="gym-actions">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setEditing(exercise)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button danger"
                      onClick={() => setDeleting(exercise)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
