import { useState } from "react";
import { leetcodeApi } from "./api";
import type { LeetCodeEntry, LeetCodeProblem } from "./types";
import { EntityFormModal } from "../../components/EntityFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { createEntryFields, editEntryFields } from "./entryFields";

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
            <tr>
              <th>#</th>
              <th>Problem</th>
              <th>Status</th>
              <th>Hints Used</th>
              <th>Time (min)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
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
