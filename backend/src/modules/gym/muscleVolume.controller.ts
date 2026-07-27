import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";
import { muscleVolume, toUtcDay } from "./metrics";

// ─────────────────────────────────────────
// /api/gym/muscle-volume — the heat map's numbers, per user
// ─────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

// A closed set rather than an arbitrary integer: the client only offers these
// four windows, and each one is a labelled bin on the map's filter row.
// 0 means all-time.
const ALLOWED_DAYS = [0, 7, 30, 90, 365];
const DEFAULT_DAYS = 30;

type ParsedDays =
  | { ok: true; value: number }
  | { ok: false; error: string };

function parseDays(value: unknown): ParsedDays {
  if (value === undefined) {
    return { ok: true, value: DEFAULT_DAYS };
  }
  const days = Number(value);
  if (!Number.isInteger(days) || !ALLOWED_DAYS.includes(days)) {
    return { ok: false, error: `days must be one of ${ALLOWED_DAYS.join(", ")}` };
  }
  return { ok: true, value: days };
}

export async function getMuscleVolume(req: AuthedRequest, res: Response) {
  const days = parseDays(req.query.days);
  if (!days.ok) {
    return res.status(400).json({ error: days.error });
  }

  // Sessions are stored at UTC midnight, so the window start is snapped there
  // too — otherwise `days=7` would clip a fraction of the seventh day.
  const to = toUtcDay(new Date());
  const from = days.value === 0 ? null : new Date(to.getTime() - days.value * DAY_MS);

  try {
    const sets = await prisma.workoutSet.findMany({
      where: {
        // Warmups exist in the log but never count toward a metric (§3.1).
        isWarmup: false,
        // A set has no userId of its own — ownership scopes through two
        // relations, which is what keeps B's map free of A's training.
        workoutExercise: {
          session: {
            userId: req.user!.id,
            ...(from ? { performedAt: { gte: from } } : {}),
          },
        },
      },
      include: {
        workoutExercise: {
          select: { exercise: { select: { primaryMuscles: true, secondaryMuscles: true } } },
        },
      },
    });

    // No upper bound on the query: a date-only performedAt is allowed a day of
    // future slack (§1-C), so clamping at `to` would drop today's session for
    // anyone ahead of UTC.
    const volume = muscleVolume(sets.map((set) => set.workoutExercise.exercise));

    res.json({
      days: days.value,
      from: from ? from.toISOString() : null,
      to: to.toISOString(),
      ...volume,
    });
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch muscle volume" });
  }
}
