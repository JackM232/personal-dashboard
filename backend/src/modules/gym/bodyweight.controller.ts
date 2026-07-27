import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";
import { parseDayInput } from "./metrics";

// ─────────────────────────────────────────
// /api/bodyweight-entries — one weigh-in per day, per user
// ─────────────────────────────────────────

function isValidWeight(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export async function listBodyweightEntries(req: AuthedRequest, res: Response) {
  try {
    const entries = await prisma.bodyweightEntry.findMany({
      where: { userId: req.user!.id },
      // Ascending — this list feeds a chart, which reads left to right.
      orderBy: { recordedAt: "asc" },
    });
    res.json(entries);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch bodyweight entries" });
  }
}

export async function createBodyweightEntry(req: AuthedRequest, res: Response) {
  const { recordedAt, weight, notes } = req.body;

  if (!recordedAt) {
    return res.status(400).json({ error: "recordedAt is required" });
  }
  const parsed = parseDayInput(recordedAt, "recordedAt");
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }
  if (!isValidWeight(weight)) {
    return res.status(400).json({ error: "weight must be a number greater than 0" });
  }

  try {
    const entry = await prisma.bodyweightEntry.create({
      data: { userId: req.user!.id, recordedAt: parsed.value, weight, notes },
    });
    res.status(201).json(entry);
  }
  catch (err: any) {
    // @@unique([userId, recordedAt]) — one weigh-in per day, by design.
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A bodyweight entry already exists for this date" });
    }
    res.status(500).json({ error: "Failed to create bodyweight entry" });
  }
}

export async function updateBodyweightEntry(req: AuthedRequest, res: Response) {
  const { recordedAt, weight, notes } = req.body;

  let recordedAtValue: Date | undefined;
  if (recordedAt !== undefined) {
    const parsed = parseDayInput(recordedAt, "recordedAt");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    recordedAtValue = parsed.value;
  }

  if (weight !== undefined && !isValidWeight(weight)) {
    return res.status(400).json({ error: "weight must be a number greater than 0" });
  }

  try {
    const result = await prisma.bodyweightEntry.updateMany({
      where: { id: req.params.id as string, userId: req.user!.id },
      data: { recordedAt: recordedAtValue, weight, notes },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Bodyweight entry not found" });
    }

    res.status(204).send();
  }
  catch (err: any) {
    // Moving an entry onto a date that already has one hits the same constraint.
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A bodyweight entry already exists for this date" });
    }
    res.status(500).json({ error: "Failed to update bodyweight entry" });
  }
}

export async function deleteBodyweightEntry(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.bodyweightEntry.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Bodyweight entry not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete bodyweight entry" });
  }
}
