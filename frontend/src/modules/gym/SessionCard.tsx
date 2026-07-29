import { useState } from "react";
import { gymApi } from "../../api/gym";
import type { Exercise, WorkoutExercise, WorkoutSession, WorkoutSet } from "../../api/gym";
import { EntityFormModal } from "../../components/EntityFormModal";
import type { FieldConfig } from "../../components/EntityFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SetEditor } from "./SetEditor";
import { sessionFields } from "./sessionFields";
import { formatSessionDate, toDateInput } from "./labels";

interface AddExerciseValues extends Record<string, unknown> {
  exerciseId: string;
}

function SetSummary({ sets }: { sets: WorkoutSet[] }) {
  if (sets.length === 0) return <span className="gym-muted">No sets logged</span>;

  return (
    <span className="session-sets">
      {sets.map((set, index) => (
        <span key={set.id} className={`session-set ${set.isWarmup ? "is-warmup" : ""}`}>
          {set.reps}×{set.weight === null ? "BW" : set.weight}
          {set.isWarmup && <sup className="session-set-marker">W</sup>}
          {index < sets.length - 1 && ","}
        </span>
      ))}
    </span>
  );
}

interface SessionCardProps {
  session: WorkoutSession;
  exercises: Exercise[];
  onSessionsChanged: () => Promise<void>;
}

export function SessionCard({ session, exercises, onSessionsChanged }: SessionCardProps) {
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);
  const [editingSets, setEditingSets] = useState<WorkoutExercise | null>(null);
  const [removing, setRemoving] = useState<WorkoutExercise | null>(null);

  const addExerciseFields: FieldConfig<AddExerciseValues>[] = [
    {
      key: "exerciseId",
      label: "Exercise",
      type: "select",
      required: true,
      options: exercises.map((exercise) => ({ value: exercise.id, label: exercise.name })),
    },
  ];

  async function handleAddExercise(values: Partial<AddExerciseValues>) {
    if (!values.exerciseId) return;
    await gymApi.createWorkoutExercise({ sessionId: session.id, exerciseId: values.exerciseId });
    await onSessionsChanged();
  }

  async function handleUpdateSession(values: Partial<WorkoutSession>) {
    await gymApi.updateSession(session.id, {
      performedAt: values.performedAt,
      name: values.name || null,
      notes: values.notes || null,
    });
    await onSessionsChanged();
  }

  async function handleDeleteSession() {
    await gymApi.deleteSession(session.id);
    await onSessionsChanged();
  }

  async function handleRemoveExercise() {
    if (!removing) return;
    await gymApi.deleteWorkoutExercise(removing.id);
    await onSessionsChanged();
  }

  return (
    <div className="session-card">
      <EntityFormModal
        open={addExerciseOpen}
        onClose={() => setAddExerciseOpen(false)}
        title="Add Exercise to Session"
        fields={addExerciseFields}
        onSubmit={handleAddExercise}
        submitLabel="Add"
      />

      <EntityFormModal
        open={editingSession}
        onClose={() => setEditingSession(false)}
        title="Edit Workout"
        fields={sessionFields}
        initialValues={{
          performedAt: toDateInput(session.performedAt),
          name: session.name ?? "",
          notes: session.notes ?? "",
        }}
        onSubmit={handleUpdateSession}
        submitLabel="Save"
      />

      <ConfirmDialog
        open={deletingSession}
        onClose={() => setDeletingSession(false)}
        onConfirm={handleDeleteSession}
        title="Delete Workout"
        message={`Delete the workout logged on ${formatSessionDate(session.performedAt)}? Its exercises and sets go with it.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemoveExercise}
        title="Remove Exercise"
        message={removing ? `Remove ${removing.exercise.name} from this workout?` : ""}
        confirmLabel="Remove"
      />

      <SetEditor
        open={editingSets !== null}
        onClose={() => setEditingSets(null)}
        workoutExercise={editingSets}
        onSaved={onSessionsChanged}
      />

      <div className="session-card-header">
        <div>
          <h2 className="session-card-date">{formatSessionDate(session.performedAt)}</h2>
          {session.name && <p className="session-card-name">{session.name}</p>}
        </div>
        <div className="gym-actions">
          <button
            type="button"
            className="link-button"
            onClick={() => setAddExerciseOpen(true)}
            disabled={exercises.length === 0}
          >
            Add Exercise
          </button>
          <button type="button" className="link-button" onClick={() => setEditingSession(true)}>
            Edit
          </button>
          <button
            type="button"
            className="link-button danger"
            onClick={() => setDeletingSession(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {session.notes && <p className="session-card-notes">{session.notes}</p>}

      {session.exercises.length === 0 ? (
        <p className="gym-muted">No exercises yet.</p>
      ) : (
        <ul className="session-exercises">
          {session.exercises.map((workoutExercise) => (
            <li key={workoutExercise.id} className="session-exercise">
              <div className="session-exercise-line">
                <span className="session-exercise-name">{workoutExercise.exercise.name}</span>
                <span className="session-exercise-dash">—</span>
                <SetSummary sets={workoutExercise.sets} />
              </div>
              <div className="gym-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setEditingSets(workoutExercise)}
                >
                  Sets
                </button>
                <button
                  type="button"
                  className="link-button danger"
                  onClick={() => setRemoving(workoutExercise)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
