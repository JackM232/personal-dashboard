import { useState } from "react";
import { leetcodeApi } from "./api";
import type { LeetCodeEntry, LeetCodeProblem } from "./types";
import { EntityFormModal } from "../../components/EntityFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { createEntryFields, editEntryFields } from "./entryFields";

const columns: SortableColumn<LeetCodeEntry>[] = [
  { key: "number", label: "#", type: "number", value: (e) => e.problem?.number ?? null },
  { key: "problem", label: "Problem", type: "text", value: (e) => e.problem?.name ?? null },
  {
    key: "status",
    label: "Status",
    type: "enum",
    value: (e) => e.status,
    options: ["UNATTEMPTED", "STARTED", "COMPLETED"],
  },
  { key: "hintsUsed", label: "Hints Used", type: "number", value: (e) => e.hintsUsed },
  { key: "timeTaken", label: "Time (min)", type: "number", value: (e) => e.timeTaken },
];

interface EntriesTabProps {
  problems: LeetCodeProblem[];
  entries: LeetCodeEntry[];
  onEntriesChanged: () => Promise<void>;
  addEntryOpen: boolean;
  onAddEntryOpenChange: (open: boolean) => void;
}

export function EntriesTab({
  problems,
  entries,
  onEntriesChanged,
  addEntryOpen,
  onAddEntryOpenChange,
}: EntriesTabProps) {
  const [editingEntry, setEditingEntry] = useState<LeetCodeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<LeetCodeEntry | null>(null);
  const { sorted: sortedEntries, sort, setSort } = useSortedRows(entries, columns);

  async function handleCreateEntry(values: Partial<LeetCodeEntry>) {
    await leetcodeApi.createEntry(values);
    await onEntriesChanged();
  }

  async function handleUpdateEntry(values: Partial<LeetCodeEntry>) {
    if (!editingEntry) return;
    await leetcodeApi.updateEntry(editingEntry.id, values);
    await onEntriesChanged();
  }

  async function handleDeleteEntry() {
    if (!deletingEntry) return;
    await leetcodeApi.deleteEntry(deletingEntry.id);
    await onEntriesChanged();
  }

  return (
    <div>
      <EntityFormModal
        open={addEntryOpen}
        onClose={() => onAddEntryOpenChange(false)}
        title="Add Entry"
        fields={createEntryFields(problems)}
        onSubmit={handleCreateEntry}
        submitLabel="Add"
      />

      <EntityFormModal
        open={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
        title="Edit Entry"
        fields={editEntryFields}
        initialValues={
          editingEntry
            ? {
                status: editingEntry.status,
                hintsUsed: editingEntry.hintsUsed,
                timeTaken: editingEntry.timeTaken ?? undefined,
                videoWatched: editingEntry.videoWatched,
                notes: editingEntry.notes ?? undefined,
              }
            : undefined
        }
        onSubmit={handleUpdateEntry}
        submitLabel="Save"
      />

      <ConfirmDialog
        open={deletingEntry !== null}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleDeleteEntry}
        title="Delete Entry"
        message={
          deletingEntry
            ? `Delete entry for ${
                deletingEntry.problem
                  ? `#${deletingEntry.problem.number} ${deletingEntry.problem.name}`
                  : deletingEntry.problemId
              }? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
      />

      {entries.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <table>
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              <th></th>
            </SortHeaders>
          </thead>
          <tbody>
            {sortedEntries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.problem?.number ?? "—"}</td>
                <td>{entry.problem?.name ?? entry.problemId}</td>
                <td>{entry.status}</td>
                <td>{entry.hintsUsed}</td>
                <td>{entry.timeTaken ?? "—"}</td>
                <td className="entry-actions">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setEditingEntry(entry)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="link-button danger"
                    onClick={() => setDeletingEntry(entry)}
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
