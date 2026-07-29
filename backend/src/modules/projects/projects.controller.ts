import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { ProjectKind, ProjectStatus } from "../../generated/prisma";
import { AuthedRequest } from "../auth/middleware";
import { isEnumValue, parsePastDay, parseTechStack } from "./validation";

// Statuses that mean work has actually begun — reaching one stamps startedAt.
const ACTIVE_STATUSES: ProjectStatus[] = [
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.PAUSED,
  ProjectStatus.SHIPPED,
];

export async function listProjects(req: AuthedRequest, res: Response) {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: "desc" },
    });
    res.json(projects);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
}

export async function createProject(req: AuthedRequest, res: Response) {
  const { name, description, kind, status, techStack, repoUrl, liveUrl, startedAt, completedAt, notes } =
    req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "name is required" });
  }
  if (kind !== undefined && !isEnumValue(ProjectKind, kind)) {
    return res.status(400).json({ error: "Invalid kind" });
  }
  if (status !== undefined && !isEnumValue(ProjectStatus, status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const parsedStart = parsePastDay(startedAt, "startedAt");
  if (!parsedStart.ok) return res.status(400).json({ error: parsedStart.error });
  const parsedCompleted = parsePastDay(completedAt, "completedAt");
  if (!parsedCompleted.ok) return res.status(400).json({ error: parsedCompleted.error });
  const parsedTech = parseTechStack(techStack);
  if (!parsedTech.ok) return res.status(400).json({ error: parsedTech.error });

  // Creating a project already in flight without a start date is the common
  // case — "I've been working on this for a while and only now logged it".
  const stampStart = status !== undefined && ACTIVE_STATUSES.includes(status) && !parsedStart.value;
  const stampCompleted = status === ProjectStatus.SHIPPED && !parsedCompleted.value;

  try {
    const project = await prisma.project.create({
      data: {
        userId: req.user!.id,
        name: String(name).trim(),
        description: description || null,
        kind,
        status,
        techStack: parsedTech.value ?? [],
        repoUrl: repoUrl || null,
        liveUrl: liveUrl || null,
        startedAt: stampStart ? new Date() : parsedStart.value,
        completedAt: stampCompleted ? new Date() : parsedCompleted.value,
        notes: notes || null,
      },
    });
    res.status(201).json(project);
  }
  catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A project with this name already exists" });
    }
    res.status(500).json({ error: "Failed to create project" });
  }
}

export async function updateProject(req: AuthedRequest, res: Response) {
  const { name, description, kind, status, techStack, repoUrl, liveUrl, startedAt, completedAt, notes } =
    req.body;

  if (name !== undefined && !String(name).trim()) {
    return res.status(400).json({ error: "name cannot be empty" });
  }
  if (kind !== undefined && !isEnumValue(ProjectKind, kind)) {
    return res.status(400).json({ error: "Invalid kind" });
  }
  if (status !== undefined && !isEnumValue(ProjectStatus, status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const parsedStart = parsePastDay(startedAt, "startedAt");
  if (!parsedStart.ok) return res.status(400).json({ error: parsedStart.error });
  const parsedCompleted = parsePastDay(completedAt, "completedAt");
  if (!parsedCompleted.ok) return res.status(400).json({ error: parsedCompleted.error });
  const parsedTech = parseTechStack(techStack);
  if (!parsedTech.ok) return res.status(400).json({ error: parsedTech.error });

  try {
    const existing = await prisma.project.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Status drives the two timestamps unless the payload sets them itself.
    // Moving off SHIPPED clears completedAt: a reopened project has no
    // completion date, and a stale one would misreport how long it took.
    const nextStatus = status ?? existing.status;
    let startedAtValue = parsedStart.value;
    let completedAtValue = parsedCompleted.value;

    if (startedAt === undefined && ACTIVE_STATUSES.includes(nextStatus) && !existing.startedAt) {
      startedAtValue = new Date();
    }
    if (completedAt === undefined) {
      if (nextStatus === ProjectStatus.SHIPPED && !existing.completedAt) {
        completedAtValue = new Date();
      }
      else if (nextStatus !== ProjectStatus.SHIPPED && existing.completedAt) {
        completedAtValue = null;
      }
    }

    const project = await prisma.project.update({
      where: { id: existing.id },
      data: {
        name: name === undefined ? undefined : String(name).trim(),
        description,
        kind,
        status,
        techStack: parsedTech.value,
        repoUrl,
        liveUrl,
        startedAt: startedAtValue,
        completedAt: completedAtValue,
        notes,
      },
    });
    res.json(project);
  }
  catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "A project with this name already exists" });
    }
    res.status(500).json({ error: "Failed to update project" });
  }
}

// Milestones cascade — they have no meaning without the project they belong to.
export async function deleteProject(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.project.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
}
