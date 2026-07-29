import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { Prisma, TaskPriority } from "../../generated/prisma";
import { AuthedRequest } from "../auth/middleware";
import { isEnumValue, parseDay } from "./validation";

// Enough of the parent list to label the row without a second request.
const taskInclude = {
  list: { select: { id: true, title: true, date: true } },
} as const;

// Outstanding first, then by due date, then most urgent. A task with no due date
// is undated rather than overdue, so it sinks below the ones that have one —
// `nulls: "last"` says so explicitly instead of relying on the column order.
const taskOrder: Prisma.TaskOrderByWithRelationInput[] = [
  { done: "asc" },
  { dueDate: { sort: "asc", nulls: "last" } },
  { priority: "desc" },
  { createdAt: "asc" },
];

// ?listId=unsorted is the one bucket that has no id of its own, so it gets a
// reserved word. A real cuid can never collide with it.
const UNSORTED = "unsorted";

export async function listTasks(req: AuthedRequest, res: Response) {
  const { listId } = req.query;

  if (listId !== undefined && typeof listId !== "string") {
    return res.status(400).json({ error: "Invalid listId" });
  }

  // Omitted means every task regardless of list — the three views the UI offers
  // are this one list, filtered.
  const scope =
    listId === undefined ? {} : { listId: listId === UNSORTED ? null : listId };

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user!.id, ...scope },
      orderBy: taskOrder,
      include: taskInclude,
    });
    res.json(tasks);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
}

// Checked rather than left to the foreign key: a valid id belonging to someone
// else would otherwise succeed. Returns the id, or null when there is nothing
// to check.
async function ownedListId(listId: unknown, userId: string): Promise<string | null> {
  if (!listId) return null;
  const list = await prisma.taskList.findFirst({
    where: { id: String(listId), userId },
    select: { id: true },
  });
  return list?.id ?? null;
}

export async function createTask(req: AuthedRequest, res: Response) {
  const { listId, title, done, priority, dueDate } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  if (priority !== undefined && !isEnumValue(TaskPriority, priority)) {
    return res.status(400).json({ error: "Invalid priority" });
  }

  // A due date is allowed to be in the future — that is the point of one.
  const parsedDue = parseDay(dueDate, "dueDate");
  if (!parsedDue.ok) return res.status(400).json({ error: parsedDue.error });

  try {
    let resolvedListId: string | null = null;
    if (listId) {
      resolvedListId = await ownedListId(listId, req.user!.id);
      if (!resolvedListId) {
        return res.status(400).json({ error: "Invalid listId" });
      }
    }

    const task = await prisma.task.create({
      data: {
        userId: req.user!.id,
        listId: resolvedListId,
        title: String(title).trim(),
        done: Boolean(done),
        priority,
        dueDate: parsedDue.value,
      },
      include: taskInclude,
    });
    res.status(201).json(task);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to create task" });
  }
}

export async function updateTask(req: AuthedRequest, res: Response) {
  const { listId, title, done, priority, dueDate } = req.body;

  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ error: "title cannot be empty" });
  }
  if (priority !== undefined && !isEnumValue(TaskPriority, priority)) {
    return res.status(400).json({ error: "Invalid priority" });
  }

  const parsedDue = parseDay(dueDate, "dueDate");
  if (!parsedDue.ok) return res.status(400).json({ error: parsedDue.error });

  try {
    const existing = await prisma.task.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Moving a task between lists and unsorting it are the same operation: null
    // (or "") means the unsorted bucket, undefined leaves it where it is.
    let listIdValue: string | null | undefined;
    if (listId !== undefined) {
      if (!listId) {
        listIdValue = null;
      }
      else {
        listIdValue = await ownedListId(listId, req.user!.id);
        if (!listIdValue) {
          return res.status(400).json({ error: "Invalid listId" });
        }
      }
    }

    const task = await prisma.task.update({
      where: { id: existing.id },
      data: {
        listId: listIdValue,
        title: title === undefined ? undefined : String(title).trim(),
        done: done === undefined ? undefined : Boolean(done),
        priority,
        dueDate: parsedDue.value,
      },
      include: taskInclude,
    });
    res.json(task);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
}

export async function deleteTask(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.task.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
}
