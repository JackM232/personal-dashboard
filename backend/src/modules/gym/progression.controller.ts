import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";
import { progressionMetrics, toUtcDay } from "./metrics";

// ─────────────────────────────────────────
// /api/gym/progression/:exerciseId — one exercise's history, per user
// ─────────────────────────────────────────

type ParsedBound =
  | { ok: true; value: Date | undefined }
  | { ok: false; error: string };

// Sessions are stored at UTC midnight, so the bounds are snapped there too —
// otherwise a `to` with a time component would compare against a day boundary
// and quietly drop that day's session.
function parseBound(value: unknown, field: string): ParsedBound {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: `Invalid ${field}` };
  }
  return { ok: true, value: toUtcDay(date) };
}

export async function getProgression(req: AuthedRequest, res: Response) {
  const exerciseId = req.params.exerciseId as string;

  const from = parseBound(req.query.from, "from");
  if (!from.ok) {
    return res.status(400).json({ error: from.error });
  }
  const to = parseBound(req.query.to, "to");
  if (!to.ok) {
    return res.status(400).json({ error: to.error });
  }

  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, name: true },
    });
    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    const performedAt: { gte?: Date; lte?: Date } = {};
    if (from.value) performedAt.gte = from.value;
    if (to.value) performedAt.lte = to.value;

    const rows = await prisma.workoutExercise.findMany({
      where: {
        exerciseId,
        // A WorkoutExercise has no userId of its own — the per-user filter runs
        // through the session relation, which is what keeps B out of A's numbers.
        session: {
          userId: req.user!.id,
          ...(from.value || to.value ? { performedAt } : {}),
        },
      },
      include: {
        sets: true,
        session: { select: { id: true, performedAt: true } },
      },
    });

    const points = rows
      .map((row) => ({
        sessionId: row.session.id,
        performedAt: row.session.performedAt,
        ...progressionMetrics(row.sets),
      }))
      // An exercise logged with warmups only is not a data point.
      .filter((point) => point.workingSets > 0)
      // Ascending — charts read left to right, and the client should not re-sort.
      .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime());

    // All three metrics in one response, so the client's metric toggle never refetches.
    res.json({ exercise, points });
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch progression" });
  }
}
