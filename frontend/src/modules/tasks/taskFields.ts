import type { FieldConfig } from "../../components/EntityFormModal";
import { TASK_PRIORITIES, listLabel, priorityLabel } from "./labels";
import type { Task, TaskBody, TaskList, TaskListBody } from "./types";

// The empty value is a real choice here, not a blank — it's the unsorted bucket,
// and it leads because a task you're jotting down usually has no list yet.
export const UNSORTED_OPTION = { value: "", label: "— Unsorted —" };

// The list of lists is user data, so the options can't be a module constant.
export function taskFields(lists: TaskList[]): FieldConfig<Task>[] {
  return [
    { key: "title", label: "Task", type: "text", required: true },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      options: TASK_PRIORITIES.map((value) => ({ value, label: priorityLabel(value) })),
      required: true,
    },
    { key: "dueDate", label: "Due date", type: "date" },
    {
      key: "listId",
      label: "List",
      type: "select",
      options: [UNSORTED_OPTION, ...lists.map((list) => ({ value: list.id, label: listLabel(list) }))],
    },
  ];
}

// Title is optional — an untitled list is labelled by its date.
export const taskListFields: FieldConfig<TaskList>[] = [
  { key: "date", label: "Date", type: "date", required: true },
  { key: "title", label: "Title", type: "text" },
];

// EntityFormModal hands every field back as a string; normalise to what the API
// expects. `done` is a checkbox owned by the table rather than the form, so it
// is passed separately instead of read off `values`.
export function toTaskBody(values: Partial<Task>, done: boolean): TaskBody {
  return {
    // "" is the unsorted option, and the API reads null as "no list" — sending
    // the empty string through would be an invalid id.
    listId: values.listId || null,
    title: (values.title ?? "").trim(),
    priority: values.priority,
    dueDate: values.dueDate || null,
    done,
  };
}

export function toTaskListBody(values: Partial<TaskList>): TaskListBody {
  return {
    title: values.title?.trim() || null,
    date: values.date,
  };
}
