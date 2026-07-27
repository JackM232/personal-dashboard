// Derived math shared across the gym module. Anything computed from workout rows
// belongs here so the log, the progression charts, and the muscle map cannot drift.

import { MuscleGroup } from "../../generated/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

// Sessions and weigh-ins are date-only facts. Storing them at UTC midnight keeps
// "one row per day" exact no matter which timezone the caller submitted from.
export function toUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export type ParsedDay =
  | { ok: true; value: Date }
  | { ok: false; error: string };

// Every date-only field the log writes goes through here — session dates and
// weigh-in dates alike — so they cannot disagree about what "a day" is.
//
// A date-only string parses as UTC midnight, so allow a day of slack before
// calling it "future" — otherwise today's date rejects for users ahead of UTC.
export function parseDayInput(value: unknown, field: string): ParsedDay {
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: `Invalid ${field}` };
  }
  if (date.getTime() > Date.now() + DAY_MS) {
    return { ok: false, error: `${field} cannot be in the future` };
  }
  return { ok: true, value: toUtcDay(date) };
}

// Only the fields the metrics actually read, so this works on a Prisma row or a
// hand-built test fixture alike.
export interface MetricSet {
  reps: number;
  weight: number | null;
  isWarmup: boolean;
}

export interface ProgressionMetrics {
  topSetWeight: number | null;
  estimated1RM: number | null;
  totalVolume: number;
  workingSets: number;
  totalReps: number;
}

// Warmups exist in the log and are displayed, but they never count toward a
// metric. Every derived number in this module starts here.
export function workingSets<T extends { isWarmup: boolean }>(sets: T[]): T[] {
  return sets.filter((set) => !set.isWarmup);
}

// One exercise within one session, reduced to the numbers a chart can plot.
// Unloaded sets (weight === null — pull-ups, dips) still count toward reps and
// set count, but cannot produce a top set or a 1RM estimate.
export function progressionMetrics(sets: MetricSet[]): ProgressionMetrics {
  const working = workingSets(sets);

  let topSetWeight: number | null = null;
  let estimated1RM: number | null = null;
  let totalVolume = 0;
  let totalReps = 0;

  for (const set of working) {
    totalReps += set.reps;
    totalVolume += set.reps * (set.weight ?? 0);

    if (set.weight === null) continue;

    if (topSetWeight === null || set.weight > topSetWeight) {
      topSetWeight = set.weight;
    }
    // Epley, chosen over Brzycki because it degrades more gracefully above 10
    // reps. The estimate is meaningless past ~12 reps; it is reported as-is
    // rather than clamped or hidden.
    const epley = set.weight * (1 + set.reps / 30);
    if (estimated1RM === null || epley > estimated1RM) {
      estimated1RM = epley;
    }
  }

  return {
    topSetWeight,
    estimated1RM: estimated1RM === null ? null : Math.round(estimated1RM * 10) / 10,
    totalVolume,
    workingSets: working.length,
    totalReps,
  };
}

// ─────────────────────────────────────────
// Muscle stimulus — what the heat map paints
// ─────────────────────────────────────────

export const ROLE_FACTOR = { PRIMARY: 1.0, SECONDARY: 0.5 } as const;

// Declaration order, which is anatomical order. The map returns all 20 every
// time — an absent key is ambiguous, an explicit 0 is not.
export const MUSCLE_GROUPS: MuscleGroup[] = Object.values(MuscleGroup);

// Only the muscle tags of the exercise a set belongs to; the caller flattens
// whatever shape the query returned down to this.
export interface StimulusSource {
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
}

export interface MuscleStimulus {
  muscle: MuscleGroup;
  stimulus: number;
  intensity: number;
}

export interface MuscleVolume {
  maxStimulus: number;
  totalWorkingSets: number;
  groups: MuscleStimulus[];
}

// Floats accumulate in exact 0.5 steps, but the intensity division does not —
// round both so the wire format never carries binary dust.
function round(value: number, places: number): number {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
}

// The currency is *weighted working-set count*, not load volume. Load volume
// breaks on bodyweight work: pull-ups, dips and push-ups store weight = null, so
// lats and chest would contribute zero and read as untrained. Set count is
// unit-free and immune to null weights.
//
// For load-weighted stimulus instead, multiply each set's contribution below by
// `set.reps * (set.weight ?? 0)` — but that is a deliberate product decision, not
// a refactor.
//
// Callers pass working sets only; warmups never reach here (§3.1).
export function muscleVolume(sets: StimulusSource[]): MuscleVolume {
  const totals = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((muscle) => [muscle, 0]));

  for (const set of sets) {
    for (const muscle of set.primaryMuscles) {
      totals.set(muscle, (totals.get(muscle) ?? 0) + ROLE_FACTOR.PRIMARY);
    }
    for (const muscle of set.secondaryMuscles) {
      // Disjointness is enforced on catalog write, so a muscle already counted as
      // primary for this exercise can never also be counted here.
      totals.set(muscle, (totals.get(muscle) ?? 0) + ROLE_FACTOR.SECONDARY);
    }
  }

  // Intensity is relative to the user's own most-trained muscle, so the map stays
  // readable at any training level. Not comparable across windows — accepted.
  const maxStimulus = Math.max(0, ...totals.values());

  const groups = MUSCLE_GROUPS.map((muscle) => {
    const stimulus = totals.get(muscle) ?? 0;
    return {
      muscle,
      stimulus: round(stimulus, 2),
      // An empty window leaves maxStimulus at 0; guard the divide.
      intensity: maxStimulus > 0 ? round(stimulus / maxStimulus, 3) : 0,
    };
  });

  return { maxStimulus: round(maxStimulus, 2), totalWorkingSets: sets.length, groups };
}
