import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { queries } from "../../api/queries";
import type { BodyweightEntry, Exercise, WorkoutSession } from "../../api/gym";
import { useAuth } from "../../auth/useAuth";
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
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery(queries.gymSessions);
  const exercisesQuery = useQuery(queries.gymExercises);
  const entriesQuery = useQuery(queries.gymBodyweight);

  // The catalog is shared; only contributors and admins may change it.
  const canManageExercises = hasRole(user, ...CONTRIBUTOR_ROLES);

  function loadSessions() {
    // Progression is computed from sessions, so it goes stale alongside them.
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.gym.sessions }),
      queryClient.invalidateQueries({ queryKey: ["gym", "progression"] }),
      queryClient.invalidateQueries({ queryKey: ["gym", "muscle-volume"] }),
    ]).then(() => {});
  }

  function loadExercises() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.gym.exercises });
  }

  function loadEntries() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.gym.bodyweight });
  }

  const sessions: WorkoutSession[] = sessionsQuery.data ?? [];
  const exercises: Exercise[] = exercisesQuery.data ?? [];
  const entries: BodyweightEntry[] = entriesQuery.data ?? [];
  const error = sessionsQuery.error ?? exercisesQuery.error ?? entriesQuery.error;

  if (sessionsQuery.isPending || exercisesQuery.isPending || entriesQuery.isPending) {
    return <p>Loading...</p>;
  }
  if (error) return <p>Failed to load: {error.message}</p>;

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
