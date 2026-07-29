import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EntityFormModal } from "../../components/EntityFormModal";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { tasksApi } from "./api";
import { taskListFields, toTaskListBody } from "./taskFields";
import { formatDay, listLabel, toDateInput, todayInput } from "./labels";
import type { Task, TaskList } from "./types";

// Counts come from the tasks list the page already holds rather than from the
// server, so a task moving between lists updates both sides at once.
type Counts = { open: number; total: number };

const columns: SortableColumn<TaskList>[] = [
  { key: "title", label: "List", type: "text", value: (l) => listLabel(l) },
  { key: "date", label: "Date", type: "date", value: (l) => l.date },
  { key: "open", label: "Open" },
  { key: "total", label: "Tasks" },
];

interface ListsTabProps {
  lists: TaskList[];
  tasks: Task[];
  onListsChanged: () => Promise<void>;
  onOpenList: (listId: string) => void;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function ListsTab({
  lists,
  tasks,
  onListsChanged,
  onOpenList,
  addOpen,
  onAddOpenChange,
}: ListsTabProps) {
  const [editing, setEditing] = useState<TaskList | null>(null);
  const [deleting, setDeleting] = useState<TaskList | null>(null);

  const counts = useMemo(() => {
    const byList = new Map<string, Counts>();
    for (const task of tasks) {
      if (!task.listId) continue;
      const entry = byList.get(task.listId) ?? { open: 0, total: 0 };
      entry.total += 1;
      if (!task.done) entry.open += 1;
      byList.set(task.listId, entry);
    }
    return byList;
  }, [tasks]);

  const { sorted: visible, sort, setSort } = useSortedRows(lists, columns);

  async function handleCreate(values: Partial<TaskList>) {
    await tasksApi.createTaskList(toTaskListBody(values));
    await onListsChanged();
  }

  async function handleUpdate(values: Partial<TaskList>) {
    if (!editing) return;
    await tasksApi.updateTaskList(editing.id, toTaskListBody(values));
    await onListsChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await tasksApi.deleteTaskList(deleting.id);
    await onListsChanged();
  }

  const deletingCount = deleting ? counts.get(deleting.id)?.total ?? 0 : 0;

  return (
    <div>
      <EntityFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Add List"
        fields={taskListFields}
        initialValues={{ date: todayInput(), title: "" }}
        onSubmit={handleCreate}
        submitLabel="Add"
      />

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit List"
        fields={taskListFields}
        initialValues={
          editing ? { date: toDateInput(editing.date), title: editing.title ?? "" } : undefined
        }
        onSubmit={handleUpdate}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete List"
        // Says where the tasks go: deleting a list is tidying up, and it would
        // read as destructive without this.
        message={
          deleting
            ? `Delete "${listLabel(deleting)}"?${
                deletingCount > 0
                  ? ` Its ${deletingCount} task${deletingCount === 1 ? "" : "s"} will move to Unsorted.`
                  : ""
              }`
            : ""
        }
        confirmLabel="Delete"
        danger
      />

      {lists.length === 0 ? (
        <div className="tasks-empty">
          No lists yet.{" "}
          <button type="button" className="link-button" onClick={() => onAddOpenChange(true)}>
            Add the first one
          </button>
          .
        </div>
      ) : (
        <table>
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              <th></th>
            </SortHeaders>
          </thead>
          <tbody>
            {visible.map((list) => {
              const count = counts.get(list.id) ?? { open: 0, total: 0 };
              return (
                <tr key={list.id}>
                  <td>
                    <button type="button" className="link-button" onClick={() => onOpenList(list.id)}>
                      {listLabel(list)}
                    </button>
                  </td>
                  <td>{formatDay(list.date)}</td>
                  <td>{count.open}</td>
                  <td className="tasks-secondary">{count.total}</td>
                  <td className="tasks-actions">
                    <button type="button" className="link-button" onClick={() => setEditing(list)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button danger"
                      onClick={() => setDeleting(list)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
