import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { Difficulty, TopicTag, Status } from "../../generated/prisma";

function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === "string" && value in enumObj;
}


// Auth seam: replace every use of DEV_USER_ID with req.user.id when JWT lands.
export const DEV_USER_ID = "dev-user";

// ─────────────────────────────────────────
// /api/problems — shared problem catalog
// ─────────────────────────────────────────



export async function listProblems(req: Request, res: Response) {
  try {
    const problems = await prisma.leetCodeProblem.findMany();
    res.json(problems)
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch problems" });
  }
}

export async function getProblem(req: Request, res: Response) {
  try {
    const problem = await prisma.leetCodeProblem.findUnique({ where: { id: req.params.id as string } })
    if (!problem)
      return res.status(404).json({ error: "Problem not found" });

    res.json(problem)

  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch problem" });
  }
}

export async function createProblem(req: Request, res: Response) {
  const { name, difficulty, topicTag } = req.body;

  if (!name || !difficulty || !topicTag) {
    return res.status(400).json({ error: "name, difficulty, and topicTag are required" });
  }
  if (!isEnumValue(Difficulty, difficulty)) {
    return res.status(400).json({ error: "Invalid difficulty" });
  }
  if (!isEnumValue(TopicTag, topicTag)) {
    return res.status(400).json({ error: "Invalid topicTag" });
  }

  try {
    const problem = await prisma.leetCodeProblem.create({
      data: { name, difficulty, topicTag }
    });
    res.status(201).json(problem);
  }
  catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A problem with this name already exists" })
    }
    res.status(500).json({ error: "Failed to create problem" });
  }
}

export async function updateProblem(req: Request, res: Response) {
  const { name, difficulty, topicTag } = req.body;

  if (difficulty !== undefined && !isEnumValue(Difficulty, difficulty)) {
    return res.status(400).json({ error: "Invalid difficulty" });
  }
  if (topicTag !== undefined && !isEnumValue(TopicTag, topicTag)) {
    return res.status(400).json({ error: "Invalid topicTag" });
  }

  try {
    const problem = await prisma.leetCodeProblem.update({
      where: { id: req.params.id as string },
      data: { name, difficulty, topicTag }
    });
    res.json(problem)
  }
  catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Problem not found" })
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A problem with this name already exists" })
    }
    res.status(500).json({ error: "Failed to update problem" });
  }
}

export async function deleteProblem(req: Request, res: Response) {
  try {
    await prisma.leetCodeProblem.delete({
      where: { id: req.params.id as string }
    });
    res.status(204).send()
  }
  catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Problem not found" });
    }
    if (err.code === "P2003") {
      return res.status(409).json({ error: "Cannot delete a problem with existing entries" });
    }
    res.status(500).json({ error: "Failed to delete problem" })
  }
}

// ─────────────────────────────────────────
// /api/entries — per-user tracking
// ─────────────────────────────────────────

export async function listEntries(req: Request, res: Response) {
  try {
    const entries = await prisma.leetCodeEntry.findMany({
      where: { userId: DEV_USER_ID },
      include: { problem: true },
    });
    res.json(entries);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
}

export async function createEntry(req: Request, res: Response) {
  const { problemId, hintsUsed, status, timeTaken, notes } = req.body;

  if (!problemId) {
    return res.status(400).json({ error: "problemId is required" });
  }
  if (status !== undefined && !isEnumValue(Status, status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  if (hintsUsed !== undefined && (hintsUsed < 0 || hintsUsed > 4)) {
    return res.status(400).json({ error: "hintsUsed must be between 0 and 4" });
  }

  try {
    const entry = await prisma.leetCodeEntry.create({
      data: { userId: DEV_USER_ID, problemId, hintsUsed, status, timeTaken, notes },
    });
    res.status(201).json(entry);
  }
  catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "An entry for this problem already exists" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Invalid problemId" });
    }
    res.status(500).json({ error: "Failed to create entry" });
  }
}

export async function updateEntry(req: Request, res: Response) {
  const { hintsUsed, status, timeTaken, notes } = req.body;

  if (status !== undefined && !isEnumValue(Status, status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  if (hintsUsed !== undefined && (hintsUsed < 0 || hintsUsed > 4)) {
    return res.status(400).json({ error: "hintsUsed must be between 0 and 4" });
  }

  try {
    const result = await prisma.leetCodeEntry.updateMany({
      where: { id: req.params.id as string, userId: DEV_USER_ID },
      data: { hintsUsed, status, timeTaken, notes },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update entry" });
  }
}

export async function deleteEntry(req: Request, res: Response) {
  try {
    const result = await prisma.leetCodeEntry.deleteMany({
      where: { id: req.params.id as string, userId: DEV_USER_ID },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete entry" });
  }
}
