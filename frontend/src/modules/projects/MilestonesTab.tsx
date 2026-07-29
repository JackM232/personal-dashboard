import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { EntityFormModal } from "../../components/EntityFormModal";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { projectsApi } from "./api";
import { milestoneFields, toMilestoneBody } from "./projectFields";
import { formatDay, isOverdue, toDateInput } from "./labels";
import type { Project, ProjectMilestone } from "./types";

const columns: SortableColumn<ProjectMilestone>[] = [
  { key: "done", label: "Done" },
  { key: "title", label: "Milestone", type: "text", value: (m) => m.title },
  { key: "project", label: "Project", type: "text", value: (m) => m.project?.name ?? null },
  { key: "targetDate", label: "Target", type: "date", value: (m) => m.targetDate },
  { key: "completedAt", label: "Completed", type: "date", value: (m) => m.completedAt },
  { key: "notes", label: "Notes", type: "text", value: (m) => m.notes },
];

interface MilestonesTabProps {
  projects: Project[];
  milestones: ProjectMilestone[];
  onMilestonesChanged: () => Promise<void>;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function MilestonesTab({
  projects,
  milestones,
  onMilestonesChanged,
  addOpen,
  onAddOpenChange,
}: MilestonesTabProps) {
  const [editing, setEditing] = useState<ProjectMilestone | null>(null);
  const [deleting, setDeleting] = useState<ProjectMilestone | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Completed milestones pile up and are rarely what you came to look at, so
  // they are hidden until asked for.
  const rows = useMemo(
    () => (showCompleted ? milestones : milestones.filter((m) => !m.completedAt)),
    [milestones, showCompleted],
  );

  const fields = useMemo(() => milestoneFields(projects), [projects]);
  const { sorted: visible, sort, setSort } = useSortedRows(rows, columns);

  const completedCount = milestones.length - milestones.filter((m) => !m.completedAt).length;

  async function handleCreate(values: Partial<ProjectMilestone>) {
    await projectsApi.createMilestone(toMilestoneBody(values, false));
    await onMilestonesChanged();
  }

  async function handleUpdate(values: Partial<ProjectMilestone>) {
    if (!editing) return;
    // The checkbox in the row owns completion, so an edit passes the current
    // state straight back through rather than resetting it.
    await projectsApi.updateMilestone(editing.id, toMilestoneBody(values, editing.completedAt !== null));
    await onMilestonesChanged();
  }

  async function toggleDone(milestone: ProjectMilestone) {
    await projectsApi.updateMilestone(milestone.id, { completed: milestone.completedAt === null });
    await onMilestonesChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await projectsApi.deleteMilestone(deleting.id);
    await onMilestonesChanged();
  }

  return (
    <div>
      <EntityFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Add Milestone"
        fields={fields}
        initialValues={{ projectId: projects[0]?.id }}
        onSubmit={handleCreate}
        submitLabel="Add"
      />

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Milestone"
        fields={fields}
        initialValues={
          editing
            ? {
                projectId: editing.projectId,
                title: editing.title,
                targetDate: toDateInput(editing.targetDate),
                notes: editing.notes ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Milestone"
        message={deleting ? `Delete "${deleting.title}"?` : ""}
        confirmLabel="Delete"
        danger
      />

      {completedCount > 0 && (
        <label className="projects-toggle">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          <span>Show {completedCount} completed</span>
        </label>
      )}

      {projects.length === 0 ? (
        <p className="projects-muted">Add a project before logging milestones.</p>
      ) : rows.length === 0 ? (
        <p className="projects-muted">
          {milestones.length === 0 ? (
            <>
              No milestones yet.{" "}
              <button type="button" className="link-button" onClick={() => onAddOpenChange(true)}>
                Add the first one
              </button>
              .
            </>
          ) : (
            "Nothing outstanding — every milestone is done."
          )}
        </p>
      ) : (
        <table>
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              <th></th>
            </SortHeaders>
          </thead>
          <tbody>
            {visible.map((milestone) => (
              <tr key={milestone.id} className={milestone.completedAt ? "projects-row-done" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={milestone.completedAt !== null}
                    aria-label={`Mark "${milestone.title}" done`}
                    onChange={() => toggleDone(milestone)}
                  />
                </td>
                <td>{milestone.title}</td>
                <td>{milestone.project?.name ?? "—"}</td>
                <td className={isOverdue(milestone) ? "projects-overdue" : ""}>
                  {formatDay(milestone.targetDate)}
                </td>
                <td>{formatDay(milestone.completedAt)}</td>
                <td className="projects-secondary">{milestone.notes ?? "—"}</td>
                <td className="projects-actions">
                  <button type="button" className="link-button" onClick={() => setEditing(milestone)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => setDeleting(milestone)}
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
