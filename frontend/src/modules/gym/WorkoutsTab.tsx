import { useEffect, useMemo, useState } from "react";
import { gymApi } from "../../api/gym";
import type { Exercise, Progression, WorkoutSession } from "../../api/gym";
import { EntityFormModal } from "../../components/EntityFormModal";
import { SessionCard, sessionFields } from "./SessionCard";
import { METRIC_LABELS, PROGRESSION_METRICS, ProgressionChart } from "./ProgressionChart";
import type { ProgressionMetric } from "./ProgressionChart";

interface RangeOption {
  key: string;
  label: string;
  months: number | null;
}

const RANGES: RangeOption[] = [
  { key: "3M", label: "3M", months: 3 },
  { key: "6M", label: "6M", months: 6 },
  { key: "1Y", label: "1Y", months: 12 },
  { key: "ALL", label: "All", months: null },
];

// Sessions are stored at UTC midnight, so the window start is built in UTC too.
function rangeStart(months: number | null): string | undefined {
  if (months === null) return undefined;
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, now.getUTCDate()),
  );
  return start.toISOString().slice(0, 10);
}

interface ProgressionPanelProps {
  sessions: WorkoutSession[];
}

function ProgressionPanel({ sessions }: ProgressionPanelProps) {
  const [exerciseId, setExerciseId] = useState("");
  const [metric, setMetric] = useState<ProgressionMetric>("topSetWeight");
  const [rangeKey, setRangeKey] = useState("6M");
  const [progression, setProgression] = useState<Progression | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Only exercises the user has actually logged — offering all 53 when 6 are
  // logged is noise. Derived from the sessions already in memory, no extra fetch.
  const loggedExercises = useMemo(() => {
    const byId = new Map<string, string>();
    for (const session of sessions) {
      for (const workoutExercise of session.exercises) {
        byId.set(workoutExercise.exercise.id, workoutExercise.exercise.name);
      }
    }
    return [...byId]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions]);

  // Fall back to the first exercise whenever the current pick disappears — a
  // session delete can remove the only occurrence of it.
  useEffect(() => {
    if (loggedExercises.length === 0) {
      setExerciseId("");
    }
    else if (!loggedExercises.some((exercise) => exercise.id === exerciseId)) {
      setExerciseId(loggedExercises[0].id);
    }
  }, [loggedExercises, exerciseId]);

  const range = RANGES.find((option) => option.key === rangeKey) ?? RANGES[1];

  useEffect(() => {
    if (!exerciseId) {
      setProgression(null);
      return;
    }

    let cancelled = false;
    gymApi
      .getProgression(exerciseId, { from: rangeStart(range.months) })
      .then((data) => {
        if (cancelled) return;
        setProgression(data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setProgression(null);
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [exerciseId, range.months]);

  if (loggedExercises.length === 0) {
    return (
      <div className="progression-panel">
        <p className="gym-muted">Log a workout to see progression.</p>
      </div>
    );
  }

  return (
    <div className="progression-panel">
      <div className="progression-filters">
        <label>
          Exercise
          <select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>
            {loggedExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>

        <div className="gym-segmented" role="group" aria-label="Metric">
          {PROGRESSION_METRICS.map((option) => (
            <button
              key={option}
              type="button"
              className={metric === option ? "active" : ""}
              aria-pressed={metric === option}
              onClick={() => setMetric(option)}
            >
              {METRIC_LABELS[option]}
            </button>
          ))}
        </div>

        <div className="gym-segmented" role="group" aria-label="Range">
          {RANGES.map((option) => (
            <button
              key={option.key}
              type="button"
              className={rangeKey === option.key ? "active" : ""}
              aria-pressed={rangeKey === option.key}
              onClick={() => setRangeKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="gym-muted">Failed to load progression: {error}</p>}

      {progression && (
        <>
          {/* Single series ⇒ no legend; the heading names what is plotted. */}
          <h3 className="progression-heading">
            {progression.exercise.name} — {METRIC_LABELS[metric]}
          </h3>
          <ProgressionChart points={progression.points} metric={metric} />
        </>
      )}
    </div>
  );
}

interface WorkoutsTabProps {
  sessions: WorkoutSession[];
  exercises: Exercise[];
  onSessionsChanged: () => Promise<void>;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function WorkoutsTab({
  sessions,
  exercises,
  onSessionsChanged,
  addOpen,
  onAddOpenChange,
}: WorkoutsTabProps) {
  async function handleCreate(values: Partial<WorkoutSession>) {
    await gymApi.createSession({
      performedAt: values.performedAt,
      name: values.name || null,
      notes: values.notes || null,
    });
    await onSessionsChanged();
  }

  return (
    <div>
      <EntityFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Log Workout"
        fields={sessionFields}
        onSubmit={handleCreate}
        submitLabel="Log"
      />

      <ProgressionPanel sessions={sessions} />

      {/* A session is a nested structure, so it's a card list rather than a table. */}
      {sessions.length === 0 ? (
        <p>No workouts logged yet.</p>
      ) : (
        <div className="session-list">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              exercises={exercises}
              onSessionsChanged={onSessionsChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}
