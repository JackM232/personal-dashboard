import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { queries } from "../../api/queries";
import { TasksTab } from "./TasksTab";
import { ListsTab } from "./ListsTab";
import { ALL_SCOPE, UNSORTED_SCOPE, isDueToday, isOverdue } from "./labels";
import type { Task, TaskList } from "./types";
import "./TasksPage.css";

type Tab = "tasks" | "lists";

export function TasksPage() {
  const [tab, setTab] = useState<Tab>("tasks");
  const [scope, setScope] = useState<string>(ALL_SCOPE);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addListOpen, setAddListOpen] = useState(false);
  const queryClient = useQueryClient();

  const tasksQuery = useQuery(queries.tasks);
  const listsQuery = useQuery(queries.taskLists);

  function loadTasks() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.tasks.tasks });
  }

  function loadLists() {
    // Tasks carry a copy of their list's title and date, and deleting a list
    // unsorts the tasks that were on it, so a list write invalidates both.
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.tasks }),
    ]).then(() => {});
  }

  function openList(listId: string) {
    setScope(listId);
    setTab("tasks");
  }

  const tasks: Task[] = tasksQuery.data ?? [];
  const lists: TaskList[] = listsQuery.data ?? [];
  const error = tasksQuery.error ?? listsQuery.error;

  if (tasksQuery.isPending || listsQuery.isPending) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error.message}</p>;

  const open = tasks.filter((task) => !task.done);
  const dueToday = open.filter(isDueToday).length;
  const overdue = open.filter(isOverdue).length;
  const unsorted = open.filter((task) => task.listId === null).length;

  // Deleting the list you were filtered to would leave the selector pointing at
  // an id that no longer exists, and a <select> with no matching option renders
  // blank. Fall back to everything rather than an empty view.
  const activeScope =
    scope !== ALL_SCOPE && scope !== UNSORTED_SCOPE && !lists.some((list) => list.id === scope)
      ? ALL_SCOPE
      : scope;

  return (
    <div>
      <div className="tasks-header">
        <h1>Tasks</h1>
      </div>

      <div className="tasks-stat-tiles">
        <div className="tasks-stat-tile">
          <div className="tasks-stat-tile-label">Open</div>
          <div className="tasks-stat-tile-value">{open.length}</div>
        </div>
        <div className="tasks-stat-tile">
          <div className="tasks-stat-tile-label">Due today</div>
          <div className="tasks-stat-tile-value">{dueToday}</div>
        </div>
        <div className="tasks-stat-tile">
          <div className="tasks-stat-tile-label">Overdue</div>
          <div className={`tasks-stat-tile-value ${overdue > 0 ? "tasks-overdue" : ""}`}>
            {overdue}
          </div>
        </div>
        <div className="tasks-stat-tile">
          <div className="tasks-stat-tile-label">Unsorted</div>
          <div className="tasks-stat-tile-value">{unsorted}</div>
        </div>
      </div>

      <div className="tasks-tabs">
        <div className="tasks-tabs-list">
          <button
            type="button"
            className={`tasks-tab ${tab === "tasks" ? "active" : ""}`}
            onClick={() => setTab("tasks")}
          >
            Tasks
          </button>
          <button
            type="button"
            className={`tasks-tab ${tab === "lists" ? "active" : ""}`}
            onClick={() => setTab("lists")}
          >
            Lists
          </button>
        </div>

        {tab === "tasks" ? (
          <button type="button" className="add-button" onClick={() => setAddTaskOpen(true)}>
            Add Task
          </button>
        ) : (
          <button type="button" className="add-button" onClick={() => setAddListOpen(true)}>
            Add List
          </button>
        )}
      </div>

      {tab === "tasks" ? (
        <TasksTab
          lists={lists}
          tasks={tasks}
          scope={activeScope}
          onScopeChange={setScope}
          onTasksChanged={loadTasks}
          addOpen={addTaskOpen}
          onAddOpenChange={setAddTaskOpen}
        />
      ) : (
        <ListsTab
          lists={lists}
          tasks={tasks}
          onListsChanged={loadLists}
          onOpenList={openList}
          addOpen={addListOpen}
          onAddOpenChange={setAddListOpen}
        />
      )}
    </div>
  );
}
