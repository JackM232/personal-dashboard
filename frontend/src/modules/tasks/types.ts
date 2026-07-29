export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskList {
  id: string;
  userId: string;
  /** null falls back to the formatted date — see listLabel(). */
  title: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  /** null is the "unsorted" bucket, not a missing value. */
  listId: string | null;
  title: string;
  done: boolean;
  priority: TaskPriority;
  dueDate: string | null;
  // Reserved for linking a task to a row in another module. The API neither
  // accepts nor uses them yet; they are here so the row shape matches what the
  // server actually returns.
  linkedModule: string | null;
  linkedItemId: string | null;
  createdAt: string;
  updatedAt: string;
  list?: { id: string; title: string | null; date: string } | null;
}

// `listId: null` is meaningful (unsort the task), so the body can't just be a
// Partial<Task> — and `done` is toggled from the table rather than the form.
export interface TaskBody {
  listId?: string | null;
  title?: string;
  done?: boolean;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface TaskListBody {
  title?: string | null;
  date?: string;
}
