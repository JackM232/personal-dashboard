import { api } from "../../api/client";
import type { Task, TaskBody, TaskList, TaskListBody } from "./types";

export const tasksApi = {
  // No listId: every task regardless of list. The page filters the one cached
  // list client-side, so the scoped forms (`?listId=<id>`, `?listId=unsorted`)
  // are there for direct API use rather than for the UI.
  listTasks: (listId?: string) =>
    api.get<Task[]>(listId ? `/api/tasks?listId=${encodeURIComponent(listId)}` : "/api/tasks"),
  createTask: (body: TaskBody) => api.post<Task>("/api/tasks", body),
  updateTask: (id: string, body: TaskBody) => api.put<Task>(`/api/tasks/${id}`, body),
  deleteTask: (id: string) => api.delete<void>(`/api/tasks/${id}`),

  listTaskLists: () => api.get<TaskList[]>("/api/task-lists"),
  createTaskList: (body: TaskListBody) => api.post<TaskList>("/api/task-lists", body),
  updateTaskList: (id: string, body: TaskListBody) =>
    api.put<TaskList>(`/api/task-lists/${id}`, body),
  deleteTaskList: (id: string) => api.delete<void>(`/api/task-lists/${id}`),
};
