import type { BodyweightEntry, WorkoutSession } from "../../api/gym";

export const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SummaryStats {
  current: BodyweightEntry | null;
  change: number | null;
  sessionCount: number;
  totalVolume: number;
}

export function computeSummaryStats(
  entries: BodyweightEntry[],
  sessions: WorkoutSession[],
  now: number = Date.now(),
): SummaryStats {
  const cutoff = now - WINDOW_DAYS * DAY_MS;

  // Entries arrive ascending, so the last one is the most recent weigh-in.
  const current = entries.length > 0 ? entries[entries.length - 1] : null;
  const inWindow = entries.filter((entry) => Date.parse(entry.recordedAt) >= cutoff);
  // The change is measured against the oldest weigh-in still inside the
  // window. One weigh-in in 30 days is a reading, not a change.
  const change = current && inWindow.length >= 2 ? current.weight - inWindow[0].weight : null;

  const recentSessions = sessions.filter((session) => Date.parse(session.performedAt) >= cutoff);

  // Working sets only — warmups never count toward a metric (spec §3.1).
  let totalVolume = 0;
  for (const session of recentSessions) {
    for (const workoutExercise of session.exercises) {
      for (const set of workoutExercise.sets) {
        if (set.isWarmup) continue;
        totalVolume += set.reps * (set.weight ?? 0);
      }
    }
  }

  return { current, change, sessionCount: recentSessions.length, totalVolume };
}
