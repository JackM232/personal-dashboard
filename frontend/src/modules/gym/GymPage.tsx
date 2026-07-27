import { useEffect, useState } from "react";
import { gymApi } from "../../api/gym";
import type { BodyweightEntry, Exercise, WorkoutSession } from "../../api/gym";
import { useAuth } from "../../auth/AuthContext";
import { CONTRIBUTOR_ROLES, hasRole } from "../../auth/roles";
import { WorkoutsTab } from "./WorkoutsTab";
import { ExercisesTab } from "./ExercisesTab";
import { StatsTab } from "./StatsTab";
import "./GymPage.css";

type Tab = "workouts" | "exercises" | "stats";

export function GymPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("stats");
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [entries, setEntries] = useState<BodyweightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The catalog is shared; only contributors and admins may change it.
  const canManageExercises = hasRole(user, ...CONTRIBUTOR_ROLES);

  function loadSessions() {
    return gymApi.listSessions().then(setSessions);
  }

  function loadExercises() {
    return gymApi.listExercises().then(setExercises);
  }

  function loadEntries() {
    return gymApi.listBodyweightEntries().then(setEntries);
  }

  useEffect(() => {
    Promise.all([loadSessions(), loadExercises(), loadEntries()])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error}</p>;

  return (
    <div>
      <div className="gym-header">
        <h1>Gym Progress</h1>
      </div>

      <div className="gym-tabs">
        <div className="gym-tabs-list">
          <button
            type="button"
            className={`gym-tab ${tab === "stats" ? "active" : ""}`}
            onClick={() => setTab("stats")}
          >
            Stats
          </button>
          <button
            type="button"
            className={`gym-tab ${tab === "workouts" ? "active" : ""}`}
            onClick={() => setTab("workouts")}
          >
            Workouts
          </button>
          <button
            type="button"
            className={`gym-tab ${tab === "exercises" ? "active" : ""}`}
            onClick={() => setTab("exercises")}
          >
            Exercises
          </button>
        </div>

        {tab === "workouts" && (
          <button type="button" className="add-button" onClick={() => setAddSessionOpen(true)}>
            Log Workout
          </button>
        )}

        {tab === "exercises" && canManageExercises && (
          <button
            type="button"
            className="add-button secondary"
            onClick={() => setAddExerciseOpen(true)}
          >
            Add Exercise
          </button>
        )}

        {tab === "stats" && (
          <button type="button" className="add-button" onClick={() => setAddEntryOpen(true)}>
            Add Weigh-In
          </button>
        )}
      </div>

      {tab === "workouts" && (
        <WorkoutsTab
          sessions={sessions}
          exercises={exercises}
          onSessionsChanged={loadSessions}
          addOpen={addSessionOpen}
          onAddOpenChange={setAddSessionOpen}
        />
      )}

      {tab === "exercises" && (
        <ExercisesTab
          exercises={exercises}
          canManageExercises={canManageExercises}
          onExercisesChanged={loadExercises}
          addOpen={addExerciseOpen}
          onAddOpenChange={setAddExerciseOpen}
        />
      )}

      {tab === "stats" && (
        <StatsTab
          entries={entries}
          sessions={sessions}
          onEntriesChanged={loadEntries}
          addOpen={addEntryOpen}
          onAddOpenChange={setAddEntryOpen}
        />
      )}
    </div>
  );
}
