import { useMemo, useState } from "react";
import { gymApi } from "../../api/gym";
import type { BodyweightEntry, WorkoutSession } from "../../api/gym";
import { EntityFormModal } from "../../components/EntityFormModal";
import type { FieldConfig } from "../../components/EntityFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SortHeaders, useSortedRows } from "../../components/SortableTable";
import type { SortableColumn } from "../../components/SortableTable";
import { BodyweightChart } from "./BodyweightChart";
import { MuscleMapPanel } from "./muscle-map/MuscleMap";
import { formatSessionDate, toDateInput } from "./SessionCard";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

const columns: SortableColumn<BodyweightEntry>[] = [
  { key: "recordedAt", label: "Date", type: "date", value: (e) => e.recordedAt },
  { key: "weight", label: "Weight", type: "number", value: (e) => e.weight },
  { key: "notes", label: "Notes", type: "text", value: (e) => e.notes },
];

// Flat scalars only, so the shared form component fits.
interface EntryFormValues extends Record<string, unknown> {
  recordedAt: string;
  weight: number;
  notes: string;
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

const entryFields: FieldConfig<EntryFormValues>[] = [
  { key: "recordedAt", label: "Date", type: "date", required: true, max: todayInput() },
  { key: "weight", label: "Weight (lb)", type: "number", required: true },
  { key: "notes", label: "Notes", type: "text" },
];

function formatWeight(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} lb`;
}

interface StatTileProps {
  label: string;
  value: string;
  /** Sign of the change, when the tile shows one. Never the only cue — the value carries an arrow too. */
  direction?: "up" | "down" | null;
}

function StatTile({ label, value, direction }: StatTileProps) {
  const tone = direction ? ` is-${direction}` : "";
  return (
    <div className="stat-tile">
      <div className="stat-tile-label">{label}</div>
      <div className={`stat-tile-value${tone}`}>{value}</div>
    </div>
  );
}

interface SummaryTilesProps {
  entries: BodyweightEntry[];
  sessions: WorkoutSession[];
}

// A single number is a stat tile, not a chart.
function SummaryTiles({ entries, sessions }: SummaryTilesProps) {
  const stats = useMemo(() => {
    const cutoff = Date.now() - WINDOW_DAYS * DAY_MS;

    // Entries arrive ascending, so the last one is the most recent weigh-in.
    const current = entries.length > 0 ? entries[entries.length - 1] : null;
    const inWindow = entries.filter((entry) => Date.parse(entry.recordedAt) >= cutoff);
    // The change is measured against the oldest weigh-in still inside the
    // window. One weigh-in in 30 days is a reading, not a change.
    const change =
      current && inWindow.length >= 2 ? current.weight - inWindow[0].weight : null;

    const recentSessions = sessions.filter(
      (session) => Date.parse(session.performedAt) >= cutoff,
    );

    // Working sets only — warmups never count toward a metric (spec §3.1).
    let totalVolume = 0;
    for (const session of recentSessions) {
      for (const workoutExercise of session.exercises) {
        for (const set of workoutExercise.sets) {
          if (set.isWarmup) continue;
          totalVolume += set.reps * (set.weight ?? 0);
        }
      }
    }

    return { current, change, sessionCount: recentSessions.length, totalVolume };
  }, [entries, sessions]);

  const { current, change } = stats;
  const direction = change === null || change === 0 ? null : change > 0 ? "up" : "down";
  const changeValue =
    change === null
      ? "—"
      : `${direction === "up" ? "↑" : direction === "down" ? "↓" : ""} ${formatWeight(Math.abs(change))}`;

  return (
    <div className="stat-tiles">
      <StatTile
        label="Current Weight"
        value={current ? formatWeight(current.weight) : "—"}
      />
      <StatTile label={`Change (${WINDOW_DAYS}d)`} value={changeValue} direction={direction} />
      <StatTile label={`Sessions (${WINDOW_DAYS}d)`} value={String(stats.sessionCount)} />
      <StatTile
        label={`Total Volume (${WINDOW_DAYS}d)`}
        value={`${Math.round(stats.totalVolume).toLocaleString()} lb`}
      />
    </div>
  );
}

interface StatsTabProps {
  entries: BodyweightEntry[];
  sessions: WorkoutSession[];
  onEntriesChanged: () => Promise<void>;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function StatsTab({
  entries,
  sessions,
  onEntriesChanged,
  addOpen,
  onAddOpenChange,
}: StatsTabProps) {
  const [editing, setEditing] = useState<BodyweightEntry | null>(null);
  const [deleting, setDeleting] = useState<BodyweightEntry | null>(null);

  const { sorted: visible, sort, setSort } = useSortedRows(entries, columns);

  async function handleCreate(values: Partial<EntryFormValues>) {
    if (!values.recordedAt || values.weight === undefined) return;
    await gymApi.createBodyweightEntry({
      recordedAt: values.recordedAt,
      weight: values.weight,
      notes: values.notes || null,
    });
    await onEntriesChanged();
  }

  async function handleUpdate(values: Partial<EntryFormValues>) {
    if (!editing) return;
    await gymApi.updateBodyweightEntry(editing.id, {
      recordedAt: values.recordedAt,
      weight: values.weight,
      notes: values.notes || null,
    });
    await onEntriesChanged();
  }

  async function handleDelete() {
    if (!deleting) return;
    await gymApi.deleteBodyweightEntry(deleting.id);
    await onEntriesChanged();
  }

  return (
    <div>
      <EntityFormModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        title="Add Weigh-In"
        fields={entryFields}
        onSubmit={handleCreate}
        submitLabel="Add"
      />

      <EntityFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit Weigh-In"
        fields={entryFields}
        initialValues={
          editing
            ? {
                recordedAt: toDateInput(editing.recordedAt),
                weight: editing.weight,
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
        title="Delete Weigh-In"
        message={
          deleting
            ? `Delete the weigh-in recorded on ${formatSessionDate(deleting.recordedAt)}?`
            : ""
        }
        confirmLabel="Delete"
      />

      <SummaryTiles entries={entries} sessions={sessions} />

      <h2 className="stats-section-heading">Muscle Coverage</h2>
      <MuscleMapPanel />

      <h2 className="stats-section-heading">Bodyweight</h2>

      {/* An empty chart frame says nothing; ask for the first weigh-in instead. */}
      {entries.length === 0 ? (
        <p className="gym-muted">No weigh-ins yet. Add your first to start tracking.</p>
      ) : (
        <>
          <BodyweightChart entries={entries} />

          <table>
            <thead>
              <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
                <th></th>
              </SortHeaders>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatSessionDate(entry.recordedAt)}</td>
                  <td>{formatWeight(entry.weight)}</td>
                  <td>{entry.notes || <span className="gym-muted">—</span>}</td>
                  <td className="gym-actions">
                    <button type="button" className="link-button" onClick={() => setEditing(entry)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button danger"
                      onClick={() => setDeleting(entry)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
