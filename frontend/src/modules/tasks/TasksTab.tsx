import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EntityFormModal } from "../../components/EntityFormModal";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { tasksApi } from "./api";
import { taskFields, toTaskBody } from "./taskFields";
import {
  ALL_SCOPE,
  TASK_PRIORITIES,
  UNSORTED_SCOPE,
  formatDay,
  isDueToday,
  isOverdue,
  listLabel,
  priorityLabel,
  scopedTasks,
  toDateInput,
} from "./labels";
import type { Task, TaskList } from "./types";

const columns: SortableColumn<Task>[] = [
  { key: "done", label: "Done" },
  { key: "title", label: "Task", type: "text", value: (t) => t.title },
  {
    key: "priority",
    label: "Priority",
    type: "enum",
    value: (t) => t.priority,
    options: TASK_PRIORITIES,
  },
  { key: "dueDate", label: "Due", type: "date", value: (t) => t.dueDate },
  { key: "list", label: "List", type: "text", value: (t) => (t.list ? listLabel(t.list) : null) },
];

// Overdue wins over due-today: a task can't be both, and the red is the one you
// need to see first.
function dueClass(task: Task): string {
  if (isOverdue(task)) return "tasks-overdue";
  return isDueToday(task) ? "tasks-due-today" : "";
}

interface TasksTabProps {
  lists: TaskList[];
  tasks: Task[];
  scope: string;
  onScopeChange: (scope: string) => void;
  onTasksChanged: () => Promise<void>;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function TasksTab({
  lists,
  tasks,
  scope,
  onScopeChange,
  onTasksChanged,
  addOpen,
  onAddOpenChange,
}: TasksTabProps) {
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [showDone, setShowDone] = useState(false);

  const inScope = useMemo(() => scopedTasks(tasks, scope), [tasks, scope]);

  // Finished tasks pile up and are rarely what you came to look at, so they are
  // hidden until asked for.
  const rows = useMemo(
    () => (showDone ? inScope : inScope.filter((task) => !task.done)),
    [inScope, showDone],
  );

  const fields = useMemo(() => taskFields(lists), [lists]);
  const { sorted: visible, sort, setSort } = useSortedRows(rows, columns);

  const doneCount = inScope.filter((task) => task.done).length;

  // A task added while looking at one list belongs on that list; from the "all"
  // view there is nothing to infer, so it starts unsorted.
  const scopedListId = scope === ALL_SCOPE || scope === UNSORTED_SCOPE ? "" : scope;

  async function handleCreate(values: Partial<Task>) {
    await tasksApi.createTask(toTaskBody(values, false));
    await onTasksChanged();
  }

  async function handleUpdate(values: Partial<Task>) {
    if (!editing) return;
    // The checkbox in the row owns completion, so an edit passes the current
    // state straight back through rather than resetting it.
    await tasksApi.updateTask(editing.id, toTaskBody(values, editing.done));
    await onTasksChanged();
  }

  async function toggleDone(task: Task) {
    await tasksApi.updateTask(task.id, { done: !task.done });
    await onTasksChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await tasksApi.deleteTask(deleting.id);
    await onTasksChanged();
  }

  return (
    <div>
      <EntityFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Add Task"
        fields={fields}
        initialValues={{ priority: "MEDIUM", listId: scopedListId, title: "", dueDate: "" }}
        onSubmit={handleCreate}
        submitLabel="Add"
      />

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Task"
        fields={fields}
        initialValues={
          editing
            ? {
                title: editing.title,
                priority: editing.priority,
                dueDate: toDateInput(editing.dueDate),
                listId: editing.listId ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={deleting ? `Delete "${deleting.title}"?` : ""}
        confirmLabel="Delete"
        danger
      />

      <div className="tasks-filters">
        <label className="tasks-scope">
          <span>Showing</span>
          <select value={scope} onChange={(e) => onScopeChange(e.target.value)}>
            <option value={ALL_SCOPE}>All tasks</option>
            <option value={UNSORTED_SCOPE}>Unsorted</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {listLabel(list)}
              </option>
            ))}
          </select>
        </label>

        {doneCount > 0 && (
          <label className="tasks-toggle">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
            <span>Show {doneCount} done</span>
          </label>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="tasks-empty">
          {inScope.length === 0 ? (
            <>
              {scope === ALL_SCOPE ? "No tasks yet." : "Nothing on this list yet."}{" "}
              <button type="button" className="link-button" onClick={() => onAddOpenChange(true)}>
                Add one
              </button>
              .
            </>
          ) : (
            "All done here."
          )}
        </div>
      ) : (
        <table className="tasks-table">
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              <th></th>
            </SortHeaders>
          </thead>
          <tbody>
            {visible.map((task) => (
              <tr key={task.id} className={task.done ? "tasks-row-done" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={task.done}
                    aria-label={`Mark "${task.title}" done`}
                    onChange={() => toggleDone(task)}
                  />
                </td>
                <td className="tasks-title">{task.title}</td>
                <td>
                  <span className={`tasks-priority priority-${task.priority.toLowerCase()}`}>
                    {priorityLabel(task.priority)}
                  </span>
                </td>
                <td className={dueClass(task)}>{formatDay(task.dueDate)}</td>
                <td className="tasks-secondary">{task.list ? listLabel(task.list) : "Unsorted"}</td>
                <td className="tasks-actions">
                  <button type="button" className="link-button" onClick={() => setEditing(task)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => setDeleting(task)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
