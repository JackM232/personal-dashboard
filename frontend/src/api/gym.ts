import { api } from "./client";

export type MuscleGroup =
  | "UPPER_CHEST"
  | "MID_CHEST"
  | "LOWER_CHEST"
  | "FRONT_DELT"
  | "SIDE_DELT"
  | "REAR_DELT"
  | "LATS"
  | "TRAPS"
  | "RHOMBOIDS"
  | "LOWER_BACK"
  | "BICEPS"
  | "TRICEPS"
  | "FOREARMS"
  | "UPPER_ABS"
  | "LOWER_ABS"
  | "OBLIQUES"
  | "QUADS"
  | "HAMSTRINGS"
  | "GLUTES"
  | "CALVES";

export type EquipmentType =
  | "BARBELL"
  | "DUMBBELL"
  | "MACHINE"
  | "CABLE"
  | "BODYWEIGHT"
  | "KETTLEBELL"
  | "BAND"
  | "OTHER";

export interface Exercise {
  id: string;
  name: string;
  equipment: EquipmentType;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  isUnilateral: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  reps: number;
  weight: number | null;
  isWarmup: boolean;
  createdAt: string;
}

export interface WorkoutExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  position: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  exercise: Pick<Exercise, "id" | "name" | "equipment">;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  userId: string;
  performedAt: string;
  name: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutExercise[];
}

// One weigh-in. The @@unique([userId, recordedAt]) constraint means at most one
// of these per day, which is why a duplicate date comes back as a 409.
export interface BodyweightEntry {
  id: string;
  userId: string;
  recordedAt: string;
  weight: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// What the set editor submits — setNumber comes from the array order, server-side.
export interface SetInput {
  reps: number;
  weight: number | null;
  isWarmup: boolean;
}

// One session's worth of one exercise, already reduced to plottable numbers.
// All three metrics arrive together so the metric toggle never refetches.
export interface ProgressionPoint {
  sessionId: string;
  performedAt: string;
  topSetWeight: number | null;
  estimated1RM: number | null;
  totalVolume: number;
  workingSets: number;
  totalReps: number;
}

export interface Progression {
  exercise: Pick<Exercise, "id" | "name">;
  points: ProgressionPoint[];
}

// One muscle's share of the training window. `stimulus` is a weighted count of
// working sets (primary 1.0, secondary 0.5), `intensity` is that count relative
// to the user's own most-trained muscle, always in [0, 1].
export interface MuscleVolume {
  muscle: MuscleGroup;
  stimulus: number;
  intensity: number;
}

export interface MuscleVolumeSummary {
  days: number;
  /** null when days = 0, i.e. all-time. */
  from: string | null;
  to: string;
  maxStimulus: number;
  totalWorkingSets: number;
  /** All 20 groups, zeros included — an absent key would be ambiguous. */
  groups: MuscleVolume[];
}

export const gymApi = {
  listExercises: () => api.get<Exercise[]>("/api/exercises"),
  createExercise: (data: Partial<Exercise>) => api.post<Exercise>("/api/exercises", data),
  updateExercise: (id: string, data: Partial<Exercise>) =>
    api.put<Exercise>(`/api/exercises/${id}`, data),
  deleteExercise: (id: string) => api.delete<void>(`/api/exercises/${id}`),

  listSessions: () => api.get<WorkoutSession[]>("/api/workout-sessions"),
  createSession: (data: Partial<WorkoutSession>) =>
    api.post<WorkoutSession>("/api/workout-sessions", data),
  updateSession: (id: string, data: Partial<WorkoutSession>) =>
    api.put<void>(`/api/workout-sessions/${id}`, data),
  deleteSession: (id: string) => api.delete<void>(`/api/workout-sessions/${id}`),

  createWorkoutExercise: (data: { sessionId: string; exerciseId: string; notes?: string }) =>
    api.post<WorkoutExercise>("/api/workout-exercises", data),
  updateWorkoutExercise: (id: string, data: { position?: number; notes?: string }) =>
    api.put<void>(`/api/workout-exercises/${id}`, data),
  deleteWorkoutExercise: (id: string) => api.delete<void>(`/api/workout-exercises/${id}`),
  replaceSets: (id: string, sets: SetInput[]) =>
    api.put<WorkoutSet[]>(`/api/workout-exercises/${id}/sets`, { sets }),

  listBodyweightEntries: () => api.get<BodyweightEntry[]>("/api/bodyweight-entries"),
  createBodyweightEntry: (data: { recordedAt: string; weight: number; notes: string | null }) =>
    api.post<BodyweightEntry>("/api/bodyweight-entries", data),
  updateBodyweightEntry: (
    id: string,
    data: { recordedAt?: string; weight?: number; notes?: string | null },
  ) => api.put<void>(`/api/bodyweight-entries/${id}`, data),
  deleteBodyweightEntry: (id: string) => api.delete<void>(`/api/bodyweight-entries/${id}`),

  getProgression: (exerciseId: string, range?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (range?.from) query.set("from", range.from);
    if (range?.to) query.set("to", range.to);
    const suffix = query.toString() ? `?${query}` : "";
    return api.get<Progression>(`/api/gym/progression/${exerciseId}${suffix}`);
  },

  // days ∈ {7, 30, 90, 365}; 0 means all-time.
  getMuscleVolume: (days: number) =>
    api.get<MuscleVolumeSummary>(`/api/gym/muscle-volume?days=${days}`),
};
