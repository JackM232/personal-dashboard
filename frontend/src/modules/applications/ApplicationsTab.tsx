import { useState } from "react";
import { applicationsApi } from "../../api/applications";
import type { Application } from "../../api/applications";
import { EntityFormModal } from "../../components/EntityFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SortHeaders, useSortedRows } from "../../components/SortableTable";
import type { SortableColumn } from "../../components/SortableTable";
import { APPLICATION_STATUSES, applicationFields, statusLabel } from "./applicationFields";

const columns: SortableColumn<Application>[] = [
  { key: "company", label: "Company", type: "text", value: (a) => a.company },
  { key: "position", label: "Position", type: "text", value: (a) => a.position },
  {
    key: "status",
    label: "Status",
    type: "enum",
    value: (a) => a.status,
    options: APPLICATION_STATUSES,
  },
  { key: "appliedAt", label: "Applied", type: "date", value: (a) => a.appliedAt },
];

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

interface ApplicationsTabProps {
  applications: Application[];
  onApplicationsChanged: () => Promise<void>;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function ApplicationsTab({
  applications,
  onApplicationsChanged,
  addOpen,
  onAddOpenChange,
}: ApplicationsTabProps) {
  const [editing, setEditing] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);

  const { sorted: visible, sort, setSort } = useSortedRows(applications, columns);

  async function handleCreate(values: Partial<Application>) {
    await applicationsApi.createApplication(values);
    await onApplicationsChanged();
  }

  async function handleUpdate(values: Partial<Application>) {
    if (!editing) return;
    await applicationsApi.updateApplication(editing.id, values);
    await onApplicationsChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await applicationsApi.deleteApplication(deleting.id);
    await onApplicationsChanged();
  }

  return (
    <div>
      <EntityFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Add Application"
        fields={applicationFields}
        onSubmit={handleCreate}
        submitLabel="Add"
      />

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Application"
        fields={applicationFields}
        initialValues={
          editing
            ? {
                company: editing.company,
                position: editing.position,
                status: editing.status,
                location: editing.location ?? "",
                workMode: editing.workMode ?? null,
                appliedAt: toDateInput(editing.appliedAt),
                source: editing.source ?? "",
                url: editing.url ?? "",
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
        title="Delete Application"
        message={
          deleting
            ? `Delete your application for ${deleting.position} at ${deleting.company}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
      />

      {visible.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <table>
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              <th></th>
            </SortHeaders>
          </thead>
          <tbody>
            {visible.map((app) => (
              <tr key={app.id}>
                <td>{app.company}</td>
                <td>{app.position}</td>
                <td>{statusLabel(app.status)}</td>
                <td>{app.appliedAt ? toDateInput(app.appliedAt) : "—"}</td>
                <td className="applications-actions">
                  <button type="button" className="link-button" onClick={() => setEditing(app)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => setDeleting(app)}
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
