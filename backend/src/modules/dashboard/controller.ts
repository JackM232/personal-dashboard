import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";

// The server stores opaque preview ids and never interprets them — which preview
// each id names, and which of them exist at all, is the frontend's catalog. That
// keeps adding a module a frontend-only change, at the cost of these caps being
// the only thing standing between a bad client and an unbounded array.
const MAX_IDS = 32;
const MAX_ID_LENGTH = 64;

// What a user who has never customised anything sees. It is duplicated in the
// frontend catalog (which owns the labels and the components); this copy exists
// so a first-time GET returns a usable arrangement rather than a 404 the client
// has to special-case.
const DEFAULT_ORDER = [
  "tasks",
  "gym",
  "leetcode",
  "applications",
  "investments",
  "projects",
  "recipes",
];
const DEFAULT_HIDDEN = ["recipes"];

type ParsedIds = { ok: true; value: string[] } | { ok: false; error: string };

function parseIds(value: unknown, field: string): ParsedIds {
  if (!Array.isArray(value)) {
    return { ok: false, error: `${field} must be an array of strings` };
  }
  if (value.length > MAX_IDS) {
    return { ok: false, error: `${field} may contain at most ${MAX_IDS} entries` };
  }

  const ids: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || !entry.trim()) {
      return { ok: false, error: `${field} must be an array of non-empty strings` };
    }
    if (entry.length > MAX_ID_LENGTH) {
      return { ok: false, error: `${field} entries may be at most ${MAX_ID_LENGTH} characters` };
    }
    ids.push(entry.trim());
  }

  // A duplicated id would render the same card twice; the client never sends one,
  // so this is a malformed body rather than something to silently repair.
  if (new Set(ids).size !== ids.length) {
    return { ok: false, error: `${field} must not contain duplicates` };
  }

  return { ok: true, value: ids };
}

export async function getLayout(req: AuthedRequest, res: Response) {
  try {
    const layout = await prisma.dashboardLayout.findUnique({
      where: { userId: req.user!.id },
      select: { order: true, hidden: true },
    });

    // No row is the normal state for a new account, not a missing resource.
    res.json(layout ?? { order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN });
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard layout" });
  }
}

export async function saveLayout(req: AuthedRequest, res: Response) {
  const { order, hidden } = req.body;

  const parsedOrder = parseIds(order, "order");
  if (!parsedOrder.ok) return res.status(400).json({ error: parsedOrder.error });

  const parsedHidden = parseIds(hidden ?? [], "hidden");
  if (!parsedHidden.ok) return res.status(400).json({ error: parsedHidden.error });

  try {
    await prisma.dashboardLayout.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        order: parsedOrder.value,
        hidden: parsedHidden.value,
      },
      update: {
        order: parsedOrder.value,
        hidden: parsedHidden.value,
      },
    });

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to save dashboard layout" });
  }
}
