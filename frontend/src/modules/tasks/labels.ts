import type { Task, TaskList, TaskPriority } from "./types";

// Declaration order is priority order, matching the enum in schema.prisma —
// SortableTable's "enum" columns sort by position in this array, so the most
// urgent value has to come last for a descending sort to put it on top.
export const TASK_PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export function priorityLabel(priority: TaskPriority): string {
  return PRIORITY_LABELS[priority];
}

// "All tasks" and "unsorted" are views over the same cached list rather than
// ids, so they get reserved values a cuid can never collide with.
export const ALL_SCOPE = "all";
export const UNSORTED_SCOPE = "unsorted";

// The three views the module offers are one list, filtered — the API can scope
// server-side too, but doing it here keeps every view a cache hit.
export function scopedTasks(tasks: Task[], scope: string): Task[] {
  if (scope === ALL_SCOPE) return tasks;
  if (scope === UNSORTED_SCOPE) return tasks.filter((task) => task.listId === null);
  return tasks.filter((task) => task.listId === scope);
}

// Dates are stored at UTC midnight, so they are read back in UTC — otherwise
// anyone west of Greenwich sees the previous day.
export function formatDay(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

// A list's title is optional: most are just "the list for that day", so the date
// stands in for a name. Everywhere a list is named goes through here so the two
// kinds read the same.
export function listLabel(list: Pick<TaskList, "title" | "date">): string {
  return list.title?.trim() || formatDay(list.date);
}

// Undone tasks with a due date in the past. An undated task is never overdue —
// "no due date" is not "missed the date".
export function isOverdue(task: Pick<Task, "done" | "dueDate">): boolean {
  if (task.done || !task.dueDate) return false;
  return Date.parse(task.dueDate) < startOfTodayUtc();
}

export function isDueToday(task: Pick<Task, "done" | "dueDate">): boolean {
  if (task.done || !task.dueDate) return false;
  return Date.parse(task.dueDate) === startOfTodayUtc();
}

// Due dates are UTC midnight, so "today" has to be built the same way — a local
// midnight would be a few hours out and misclassify tasks either side of it.
function startOfTodayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
