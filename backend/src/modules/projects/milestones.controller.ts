import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";
import { parseDay } from "./validation";

// Enough of the parent to group and label the row without a second request.
const milestoneInclude = {
  project: { select: { id: true, name: true, status: true } },
} as const;

// Milestones are reached through their project, so every handler filters on the
// parent's userId rather than carrying a userId of its own.
const ownedBy = (userId: string) => ({ project: { userId } });

// Outstanding work first, then by target date — a milestone with no date is
// undated rather than overdue, so it sinks below the ones that have one.
const milestoneOrder = [
  { completedAt: "asc" },
  { targetDate: "asc" },
] as const;

export async function listMilestones(req: AuthedRequest, res: Response) {
  try {
    const milestones = await prisma.projectMilestone.findMany({
      where: ownedBy(req.user!.id),
      orderBy: [...milestoneOrder],
      include: milestoneInclude,
    });
    res.json(milestones);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch milestones" });
  }
}

export async function createMilestone(req: AuthedRequest, res: Response) {
  const { projectId, title, targetDate, completed, notes } = req.body;

  if (!projectId || !title || !String(title).trim()) {
    return res.status(400).json({ error: "projectId and title are required" });
  }

  // A target is allowed to be in the future — that is the point of one.
  const parsedTarget = parseDay(targetDate, "targetDate");
  if (!parsedTarget.ok) return res.status(400).json({ error: parsedTarget.error });

  try {
    // Checked rather than left to the foreign key: a valid id belonging to
    // someone else would otherwise succeed.
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id },
      select: { id: true },
    });
    if (!project) {
      return res.status(400).json({ error: "Invalid projectId" });
    }

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId: project.id,
        title: String(title).trim(),
        targetDate: parsedTarget.value,
        completedAt: completed ? new Date() : null,
        notes: notes || null,
      },
      include: milestoneInclude,
    });
    res.status(201).json(milestone);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to create milestone" });
  }
}

// Completion is toggled with a `completed` boolean rather than a raw date — the
// UI has a checkbox, and letting both through would give two ways to say it.
export async function updateMilestone(req: AuthedRequest, res: Response) {
  const { title, targetDate, completed, notes } = req.body;

  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ error: "title cannot be empty" });
  }

  const parsedTarget = parseDay(targetDate, "targetDate");
  if (!parsedTarget.ok) return res.status(400).json({ error: parsedTarget.error });

  try {
    const existing = await prisma.projectMilestone.findFirst({
      where: { id: req.params.id as string, ...ownedBy(req.user!.id) },
      select: { id: true, completedAt: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    // Re-ticking an already-done milestone keeps the original date rather than
    // resetting it to now.
    let completedAtValue: Date | null | undefined;
    if (completed !== undefined) {
      completedAtValue = completed ? existing.completedAt ?? new Date() : null;
    }

    const milestone = await prisma.projectMilestone.update({
      where: { id: existing.id },
      data: {
        title: title === undefined ? undefined : String(title).trim(),
        targetDate: parsedTarget.value,
        completedAt: completedAtValue,
        notes,
      },
      include: milestoneInclude,
    });
    res.json(milestone);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update milestone" });
  }
}

export async function deleteMilestone(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.projectMilestone.deleteMany({
      where: { id: req.params.id as string, ...ownedBy(req.user!.id) },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete milestone" });
  }
}
