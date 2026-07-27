import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";
import { parseDayInput } from "./metrics";

// The Workouts tab renders whole sessions, so the log is fetched in one shape
// rather than one query per exercise. Fine at personal scale.
const sessionInclude = {
  exercises: {
    orderBy: { position: "asc" },
    include: {
      exercise: { select: { id: true, name: true, equipment: true } },
      sets: { orderBy: { setNumber: "asc" } },
    },
  },
} as const;

// ─────────────────────────────────────────
// /api/workout-sessions — per-user workout log
// ─────────────────────────────────────────

export async function listSessions(req: AuthedRequest, res: Response) {
  try {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId: req.user!.id },
      orderBy: { performedAt: "desc" },
      include: sessionInclude,
    });
    res.json(sessions);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch workout sessions" });
  }
}

export async function getSession(req: AuthedRequest, res: Response) {
  try {
    const session = await prisma.workoutSession.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      include: sessionInclude,
    });
    if (!session) {
      return res.status(404).json({ error: "Workout session not found" });
    }
    res.json(session);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch workout session" });
  }
}

export async function createSession(req: AuthedRequest, res: Response) {
  const { performedAt, name, notes } = req.body;

  if (!performedAt) {
    return res.status(400).json({ error: "performedAt is required" });
  }
  const parsed = parseDayInput(performedAt, "performedAt");
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const session = await prisma.workoutSession.create({
      data: { userId: req.user!.id, performedAt: parsed.value, name, notes },
      include: sessionInclude,
    });
    res.status(201).json(session);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to create workout session" });
  }
}

export async function updateSession(req: AuthedRequest, res: Response) {
  const { performedAt, name, notes } = req.body;

  let performedAtValue: Date | undefined;
  if (performedAt !== undefined) {
    const parsed = parseDayInput(performedAt, "performedAt");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    performedAtValue = parsed.value;
  }

  try {
    const result = await prisma.workoutSession.updateMany({
      where: { id: req.params.id as string, userId: req.user!.id },
      data: { performedAt: performedAtValue, name, notes },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Workout session not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update workout session" });
  }
}

export async function deleteSession(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.workoutSession.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Workout session not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete workout session" });
  }
}

// ─────────────────────────────────────────
// /api/workout-exercises — exercises within a session, scoped through it
// ─────────────────────────────────────────

const workoutExerciseInclude = {
  exercise: { select: { id: true, name: true, equipment: true } },
  sets: { orderBy: { setNumber: "asc" } },
} as const;

export async function createWorkoutExercise(req: AuthedRequest, res: Response) {
  const { sessionId, exerciseId, position, notes } = req.body;

  if (!sessionId || !exerciseId) {
    return res.status(400).json({ error: "sessionId and exerciseId are required" });
  }

  try {
    // Confirm the session is the caller's before attaching to it — otherwise a
    // valid foreign key would let one user log onto another's session.
    const session = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId: req.user!.id },
      select: { id: true },
    });
    if (!session) {
      return res.status(404).json({ error: "Workout session not found" });
    }

    let nextPosition = position;
    if (nextPosition === undefined) {
      const last = await prisma.workoutExercise.findFirst({
        where: { sessionId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      nextPosition = last ? last.position + 1 : 0;
    }

    const workoutExercise = await prisma.workoutExercise.create({
      data: { sessionId, exerciseId, position: nextPosition, notes },
      include: workoutExerciseInclude,
    });
    res.status(201).json(workoutExercise);
  }
  catch (err: any) {
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Invalid exerciseId" });
    }
    res.status(500).json({ error: "Failed to add exercise to session" });
  }
}

export async function updateWorkoutExercise(req: AuthedRequest, res: Response) {
  const { position, notes } = req.body;

  try {
    const result = await prisma.workoutExercise.updateMany({
      where: { id: req.params.id as string, session: { userId: req.user!.id } },
      data: { position, notes },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Workout exercise not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update workout exercise" });
  }
}

export async function deleteWorkoutExercise(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.workoutExercise.deleteMany({
      where: { id: req.params.id as string, session: { userId: req.user!.id } },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Workout exercise not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete workout exercise" });
  }
}

interface SetRow {
  workoutExerciseId: string;
  setNumber: number;
  reps: number;
  weight: number | null;
  isWarmup: boolean;
}

type ParsedSets =
  | { ok: true; value: SetRow[] }
  | { ok: false; error: string };

// setNumber comes from the array index, never the client — that keeps the
// @@unique([workoutExerciseId, setNumber]) constraint unhittable by reordering.
function parseSets(value: unknown, workoutExerciseId: string): ParsedSets {
  if (!Array.isArray(value)) {
    return { ok: false, error: "sets must be an array" };
  }

  const rows: SetRow[] = [];
  for (const [index, entry] of value.entries()) {
    const position = index + 1;
    if (typeof entry !== "object" || entry === null) {
      return { ok: false, error: `Set ${position} must be an object` };
    }

    const { reps, weight, isWarmup } = entry as Record<string, unknown>;

    if (typeof reps !== "number" || !Number.isInteger(reps) || reps <= 0) {
      return { ok: false, error: `Set ${position}: reps must be an integer greater than 0` };
    }
    if (weight !== undefined && weight !== null && (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0)) {
      return { ok: false, error: `Set ${position}: weight must be a number of at least 0, or null` };
    }
    if (isWarmup !== undefined && typeof isWarmup !== "boolean") {
      return { ok: false, error: `Set ${position}: isWarmup must be a boolean` };
    }

    rows.push({
      workoutExerciseId,
      setNumber: position,
      reps,
      weight: weight === undefined ? null : (weight as number | null),
      isWarmup: isWarmup ?? false,
    });
  }

  return { ok: true, value: rows };
}

export async function replaceSets(req: AuthedRequest, res: Response) {
  const workoutExerciseId = req.params.id as string;

  const parsed = parseSets(req.body?.sets, workoutExerciseId);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const workoutExercise = await prisma.workoutExercise.findFirst({
      where: { id: workoutExerciseId, session: { userId: req.user!.id } },
      select: { id: true },
    });
    if (!workoutExercise) {
      return res.status(404).json({ error: "Workout exercise not found" });
    }

    // Bulk replace: the editor always submits the whole list, and an empty
    // array legitimately clears every set.
    await prisma.$transaction([
      prisma.workoutSet.deleteMany({ where: { workoutExerciseId } }),
      prisma.workoutSet.createMany({ data: parsed.value }),
    ]);

    const sets = await prisma.workoutSet.findMany({
      where: { workoutExerciseId },
      orderBy: { setNumber: "asc" },
    });
    res.json(sets);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to replace sets" });
  }
}
