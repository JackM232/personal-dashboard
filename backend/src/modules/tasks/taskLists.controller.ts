import { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AuthedRequest } from "../auth/middleware";
import { parseDay, todayUtc } from "./validation";

// Most recent day first — the list you want is nearly always the newest one.
const listOrder = [{ date: "desc" }, { createdAt: "desc" }] as const;

export async function listTaskLists(req: AuthedRequest, res: Response) {
  try {
    const lists = await prisma.taskList.findMany({
      where: { userId: req.user!.id },
      orderBy: [...listOrder],
    });
    res.json(lists);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to fetch task lists" });
  }
}

// Two lists on the same day are fine ("Work", "Personal"), but two *untitled*
// ones both render as that day's date with nothing to tell them apart. There is
// no unique index for this — it only holds when the title is absent — so it is
// checked by hand on both writes.
async function untitledExists(userId: string, date: Date, exceptId?: string): Promise<boolean> {
  const clash = await prisma.taskList.findFirst({
    where: {
      userId,
      date,
      title: null,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });
  return clash !== null;
}

export async function createTaskList(req: AuthedRequest, res: Response) {
  const { title, date } = req.body;

  const parsedDate = parseDay(date, "date");
  if (!parsedDate.ok) return res.status(400).json({ error: parsedDate.error });

  // "A list for today" is the overwhelmingly common case and needs no input at
  // all, so an omitted date is today rather than an error.
  const listDate = parsedDate.value ?? todayUtc();
  const listTitle = title && String(title).trim() ? String(title).trim() : null;

  try {
    if (!listTitle && (await untitledExists(req.user!.id, listDate))) {
      return res.status(409).json({ error: "There is already an untitled list for that day" });
    }

    const list = await prisma.taskList.create({
      data: { userId: req.user!.id, title: listTitle, date: listDate },
    });
    res.status(201).json(list);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to create task list" });
  }
}

export async function updateTaskList(req: AuthedRequest, res: Response) {
  const { title, date } = req.body;

  const parsedDate = parseDay(date, "date");
  if (!parsedDate.ok) return res.status(400).json({ error: parsedDate.error });
  // The date is what the list *is*; clearing it would leave it unlabelled.
  if (parsedDate.value === null) {
    return res.status(400).json({ error: "date cannot be cleared" });
  }

  try {
    const existing = await prisma.taskList.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      select: { id: true, title: true, date: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "Task list not found" });
    }

    // An empty title clears it back to the date-derived label, so the clash
    // check has to run against whatever the row will look like afterwards.
    const nextTitle =
      title === undefined ? existing.title : (String(title).trim() || null);
    const nextDate = parsedDate.value ?? existing.date;

    if (!nextTitle && (await untitledExists(req.user!.id, nextDate, existing.id))) {
      return res.status(409).json({ error: "There is already an untitled list for that day" });
    }

    const list = await prisma.taskList.update({
      where: { id: existing.id },
      data: { title: nextTitle, date: parsedDate.value },
    });
    res.json(list);
  }
  catch (err) {
    res.status(500).json({ error: "Failed to update task list" });
  }
}

// Tasks are not cascaded — the relation is onDelete: SetNull, so anything still
// on the list falls back to unsorted rather than being deleted along with it.
export async function deleteTaskList(req: AuthedRequest, res: Response) {
  try {
    const result = await prisma.taskList.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.id },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Task list not found" });
    }

    res.status(204).send();
  }
  catch (err) {
    res.status(500).json({ error: "Failed to delete task list" });
  }
}
