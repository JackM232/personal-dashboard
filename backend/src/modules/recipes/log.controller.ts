import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";

const DAY_MS = 24 * 60 * 60 * 1000;

type ParsedDay = { ok: true; value: Date } | { ok: false; error: string };

// A date-only string parses as UTC midnight, so allow a day of slack before
// calling it "future" — otherwise today's date rejects for users ahead of UTC.
function parseDayInput(value: unknown, field: string): ParsedDay {
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: `Invalid ${field}` };
  }
  if (date.getTime() > Date.now() + DAY_MS) {
    return { ok: false, error: `${field} cannot be in the future` };
  }
  return {
    ok: true,
    value: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
  };
}

function invalidRating(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  return !Number.isInteger(value) || (value as number) < 1 || (value as number) > 5;
}

// ─────────────────────────────────────────
// /api/cook-logs — per-user record of what got made
// ─────────────────────────────────────────

export async function listCookLogs(req: AuthedRequest, res: Response) {
  try {
    const logs = await prisma.cookLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { cookedAt: "desc" },
      include: { recipe: true },
    });
    res.json(logs);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch cook logs" });
  }
}

export async function createCookLog(req: AuthedRequest, res: Response) {
  const { recipeId, cookedAt, rating, notes } = req.body;

  if (!recipeId || !cookedAt) {
    return res.status(400).json({ error: "recipeId and cookedAt are required" });
  }
  const parsed = parseDayInput(cookedAt, "cookedAt");
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }
  if (invalidRating(rating)) {
    return res.status(400).json({ error: "rating must be between 1 and 5" });
  }

  try {
    const log = await prisma.cookLog.create({
      data: { userId: req.user!.id, recipeId, cookedAt: parsed.value, rating, notes },
      include: { recipe: true },
    });
    res.status(201).json(log);
  }
  catch (err: any) {
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Invalid recipeId" });
    }
    res.status(500).json({ error: "Failed to create cook log" });
  }
}

export async function updateCookLog(req: AuthedRequest, res: Response) {
  const { cookedAt, rating, notes } = req.body;

  let cookedAtValue: Date | undefined;
  if (cookedAt !== undefined) {
    const parsed = parseDayInput(cookedAt, "cookedAt");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }
    cookedAtValue = parsed.value;
  }
  if (invalidRating(rating)) {
    return res.status(400).json({ error: "rating must be between 1 and 5" });
  }

  try {
    const result = await prisma.cookLog.updateMany({
      where: { id: req.params.id as string, userId: req.user!.id },
      data: { cookedAt: cookedAtValue, rating, notes },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Cook log not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update cook log" });
  }
}

export async function deleteCookLog(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.cookLog.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Cook log not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete cook log" });
  }
}

// ─────────────────────────────────────────
// /api/recipe-favorites — per-user shortlist
// ─────────────────────────────────────────

export async function listFavorites(req: AuthedRequest, res: Response) {
  try {
    const favorites = await prisma.recipeFavorite.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: { recipe: true },
    });
    res.json(favorites);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
}

export async function createFavorite(req: AuthedRequest, res: Response) {
  const { recipeId } = req.body;

  if (!recipeId) {
    return res.status(400).json({ error: "recipeId is required" });
  }

  try {
    const favorite = await prisma.recipeFavorite.create({
      data: { userId: req.user!.id, recipeId },
      include: { recipe: true },
    });
    res.status(201).json(favorite);
  }
  catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "This recipe is already a favorite" });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Invalid recipeId" });
    }
    res.status(500).json({ error: "Failed to add favorite" });
  }
}

// Keyed by recipeId rather than favorite id — the star toggle knows which
// recipe it is looking at, not which row records the favourite.
export async function deleteFavorite(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.recipeFavorite.deleteMany({
      where: { recipeId: req.params.recipeId as string, userId: req.user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to remove favorite" });
  }
}
