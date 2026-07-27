import { useState } from "react";
import { interviewsApi } from "../../api/applications";
import type { Application, Interview } from "../../api/applications";
import { EntityFormModal } from "../../components/EntityFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SortHeaders, useSortedRows } from "../../components/SortableTable";
import type { SortableColumn } from "../../components/SortableTable";
import { INTERVIEW_STAGES, createInterviewFields, editInterviewFields, stageLabel } from "./interviewFields";

const columns: SortableColumn<Interview>[] = [
  { key: "company", label: "Company", type: "text", value: (i) => i.application?.company ?? null },
  { key: "position", label: "Position", type: "text", value: (i) => i.application?.position ?? null },
  { key: "stage", label: "Stage", type: "enum", value: (i) => i.stage, options: INTERVIEW_STAGES },
  { key: "scheduledAt", label: "Scheduled", type: "date", value: (i) => i.scheduledAt },
  { key: "format", label: "Format", type: "text", value: (i) => i.format },
];

function toDatetimeLocal(value: string): string {
  // Trim the ISO string to the minute; a native datetime-local input wants
  // "YYYY-MM-DDTHH:mm" and rejects the seconds/zone tail.
  return value.slice(0, 16);
}

function formatScheduled(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface InterviewsTabProps {
  applications: Application[];
  interviews: Interview[];
  onInterviewsChanged: () => Promise<void>;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function InterviewsTab({
  applications,
  interviews,
  onInterviewsChanged,
  addOpen,
  onAddOpenChange,
}: InterviewsTabProps) {
  const [editing, setEditing] = useState<Interview | null>(null);
  const [deleting, setDeleting] = useState<Interview | null>(null);

  const { sorted: visible, sort, setSort } = useSortedRows(interviews, columns);

  async function handleCreate(values: Partial<Interview>) {
    await interviewsApi.createInterview(values);
    await onInterviewsChanged();
  }

  async function handleUpdate(values: Partial<Interview>) {
    if (!editing) return;
    await interviewsApi.updateInterview(editing.id, values);
    await onInterviewsChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await interviewsApi.deleteInterview(deleting.id);
    await onInterviewsChanged();
  }

  return (
    <div>
      <EntityFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Add Interview"
        fields={createInterviewFields(applications)}
        onSubmit={handleCreate}
        submitLabel="Add"
      />

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Interview"
        fields={editInterviewFields}
        initialValues={
          editing
            ? {
                scheduledAt: toDatetimeLocal(editing.scheduledAt),
                stage: editing.stage,
                format: editing.format ?? null,
                interviewer: editing.interviewer ?? "",
                notes: editing.notes ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
        submitLabel="Save"
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Interview"
        message={
          deleting
            ? `Delete this ${stageLabel(deleting.stage).toLowerCase()} interview for ${
                deleting.application?.company ?? "this application"
              }? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
      />

      {applications.length === 0 ? (
        <p>Add an application first — interviews attach to one.</p>
      ) : visible.length === 0 ? (
        <p>No interviews scheduled.</p>
      ) : (
        <table>
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              <th></th>
            </SortHeaders>
          </thead>
          <tbody>
            {visible.map((interview) => (
              <tr key={interview.id}>
                <td>{interview.application?.company ?? "—"}</td>
                <td>{interview.application?.position ?? "—"}</td>
                <td>{stageLabel(interview.stage)}</td>
                <td>{formatScheduled(interview.scheduledAt)}</td>
                <td>{interview.format ?? "—"}</td>
                <td className="applications-actions">
                  <button type="button" className="link-button" onClick={() => setEditing(interview)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => setDeleting(interview)}
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
