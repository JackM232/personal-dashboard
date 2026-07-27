import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { EquipmentType, MuscleGroup } from "../../generated/prisma";

function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && value in enumObj;
}

// ─────────────────────────────────────────
// /api/exercises — shared exercise catalog
// ─────────────────────────────────────────

type ParsedMuscles =
  | { ok: true; value: MuscleGroup[] }
  | { ok: false; error: string };

function parseMuscles(value: unknown, field: string): ParsedMuscles {
  if (!Array.isArray(value)) {
    return { ok: false, error: `${field} must be an array` };
  }
  for (const muscle of value) {
    if (!isEnumValue(MuscleGroup, muscle)) {
      return { ok: false, error: `Invalid muscle group: ${muscle}` };
    }
  }
  // De-duplicate so a repeated tag can't inflate the muscle map.
  return { ok: true, value: [...new Set(value as MuscleGroup[])] };
}

// A muscle in both arrays would count twice on the map; the disjointness rule
// makes "primary wins" unnecessary by making the case impossible.
function overlaps(primary: MuscleGroup[], secondary: MuscleGroup[]): boolean {
  return primary.some((muscle) => secondary.includes(muscle));
}

export async function listExercises(_req: Request, res: Response) {
  try {
    const exercises = await prisma.exercise.findMany({ orderBy: { name: "asc" } });
    res.json(exercises);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
}

export async function getExercise(req: Request, res: Response) {
  try {
    const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id as string } });
    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }
    res.json(exercise);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch exercise" });
  }
}

export async function createExercise(req: Request, res: Response) {
  const { name, equipment, primaryMuscles, secondaryMuscles, isUnilateral, description } = req.body;

  if (!name || !equipment) {
    return res.status(400).json({ error: "name and equipment are required" });
  }
  if (!isEnumValue(EquipmentType, equipment)) {
    return res.status(400).json({ error: "Invalid equipment" });
  }

  const parsedPrimary = parseMuscles(primaryMuscles, "primaryMuscles");
  if (!parsedPrimary.ok) {
    return res.status(400).json({ error: parsedPrimary.error });
  }
  const parsedSecondary = parseMuscles(secondaryMuscles ?? [], "secondaryMuscles");
  if (!parsedSecondary.ok) {
    return res.status(400).json({ error: parsedSecondary.error });
  }

  // An exercise with no primary muscle contributes nothing to the heat map.
  if (parsedPrimary.value.length === 0) {
    return res.status(400).json({ error: "primaryMuscles must not be empty" });
  }
  if (overlaps(parsedPrimary.value, parsedSecondary.value)) {
    return res.status(400).json({ error: "A muscle cannot be both primary and secondary" });
  }

  try {
    const exercise = await prisma.exercise.create({
      data: {
        name,
        equipment,
        primaryMuscles: parsedPrimary.value,
        secondaryMuscles: parsedSecondary.value,
        isUnilateral,
        description,
      },
    });
    res.status(201).json(exercise);
  }
  catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "An exercise with this name already exists" });
    }
    res.status(500).json({ error: "Failed to create exercise" });
  }
}

export async function updateExercise(req: Request, res: Response) {
  const { name, equipment, primaryMuscles, secondaryMuscles, isUnilateral, description } = req.body;

  if (equipment !== undefined && !isEnumValue(EquipmentType, equipment)) {
    return res.status(400).json({ error: "Invalid equipment" });
  }

  let nextPrimary: MuscleGroup[] | undefined;
  if (primaryMuscles !== undefined) {
    const parsed = parseMuscles(primaryMuscles, "primaryMuscles");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    if (parsed.value.length === 0) {
      return res.status(400).json({ error: "primaryMuscles must not be empty" });
    }
    nextPrimary = parsed.value;
  }

  let nextSecondary: MuscleGroup[] | undefined;
  if (secondaryMuscles !== undefined) {
    const parsed = parseMuscles(secondaryMuscles, "secondaryMuscles");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    nextSecondary = parsed.value;
  }

  try {
    // Disjointness spans both arrays, so an update touching only one of them still
    // has to be checked against the stored value of the other.
    if (nextPrimary || nextSecondary) {
      const existing = await prisma.exercise.findUnique({
        where: { id: req.params.id as string },
        select: { primaryMuscles: true, secondaryMuscles: true },
      });
      if (!existing) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      if (overlaps(nextPrimary ?? existing.primaryMuscles, nextSecondary ?? existing.secondaryMuscles)) {
        return res.status(400).json({ error: "A muscle cannot be both primary and secondary" });
      }
    }

    const exercise = await prisma.exercise.update({
      where: { id: req.params.id as string },
      data: {
        name,
        equipment,
        primaryMuscles: nextPrimary,
        secondaryMuscles: nextSecondary,
        isUnilateral,
        description,
      },
    });
    res.json(exercise);
  }
  catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Exercise not found" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "An exercise with this name already exists" });
    }
    res.status(500).json({ error: "Failed to update exercise" });
  }
}

export async function deleteExercise(req: Request, res: Response) {
  try {
    await prisma.exercise.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
  }
  catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Exercise not found" });
    }
    if (err.code === "P2003") {
      return res.status(409).json({ error: "Cannot delete an exercise with logged workouts" });
    }
    res.status(500).json({ error: "Failed to delete exercise" });
  }
}
