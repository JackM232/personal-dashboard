import { useMemo, useState } from "react";
import { leetcodeApi } from "./api";
import type { Difficulty, LeetCodeEntry, LeetCodeProblem, TopicTag } from "./types";
import { EntityFormModal } from "../../components/EntityFormModal";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { SortHeaders } from "../../components/SortableTable";
import { useSortedRows } from "../../components/useSortableTable";
import type { SortableColumn } from "../../components/useSortableTable";
import { problemFields, toProblemBody } from "./problemFields";
import { createEntryFields, toEntryBody } from "./entryFields";
import "./ProblemsTab.css";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const TOPIC_TAGS: TopicTag[] = [
  "ARRAY",
  "STRING",
  "LINKED_LIST",
  "STACK",
  "QUEUE",
  "HASH_MAP",
  "TWO_POINTERS",
  "SLIDING_WINDOW",
  "BINARY_SEARCH",
  "TREE",
  "TRIE",
  "HEAP",
  "GRAPH",
  "BACKTRACKING",
  "DYNAMIC_PROGRAMMING",
  "GREEDY",
  "INTERVALS",
  "MATRIX",
  "BIT_MANIPULATION",
  "MATH",
];

const columns: SortableColumn<LeetCodeProblem>[] = [
  { key: "number", label: "#", type: "number", value: (p) => p.number },
  { key: "name", label: "Name", type: "text", value: (p) => p.name },
  {
    key: "difficulty",
    label: "Difficulty",
    type: "enum",
    value: (p) => p.difficulty,
    options: DIFFICULTIES,
  },
  { key: "topicTag", label: "Topic", type: "enum", value: (p) => p.topicTag, options: TOPIC_TAGS },
  { key: "tracking", label: "Tracking" },
];

interface ProblemsTabProps {
  problems: LeetCodeProblem[];
  entries: LeetCodeEntry[];
  canManageProblems: boolean;
  onProblemsChanged: () => Promise<void>;
  onEntriesChanged: () => Promise<void>;
  addProblemOpen: boolean;
  onAddProblemOpenChange: (open: boolean) => void;
}

export function ProblemsTab({
  problems,
  entries,
  canManageProblems,
  onProblemsChanged,
  onEntriesChanged,
  addProblemOpen,
  onAddProblemOpenChange,
}: ProblemsTabProps) {
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "ALL">("ALL");
  const [topicFilter, setTopicFilter] = useState<TopicTag | "ALL">("ALL");
  const [trackingProblem, setTrackingProblem] = useState<LeetCodeProblem | null>(null);
  const [editingProblem, setEditingProblem] = useState<LeetCodeProblem | null>(null);
  const [deletingProblem, setDeletingProblem] = useState<LeetCodeProblem | null>(null);

  const trackedProblemIds = useMemo(
    () => new Set(entries.map((entry) => entry.problemId)),
    [entries],
  );

  const filteredProblems = useMemo(
    () =>
      problems.filter(
        (p) =>
          (difficultyFilter === "ALL" || p.difficulty === difficultyFilter) &&
          (topicFilter === "ALL" || p.topicTag === topicFilter),
      ),
    [problems, difficultyFilter, topicFilter],
  );

  const { sorted: sortedProblems, sort, setSort } = useSortedRows(filteredProblems, columns);

  async function handleCreateProblem(values: Partial<LeetCodeProblem>) {
    await leetcodeApi.createProblem(toProblemBody(values));
    await onProblemsChanged();
  }

  async function handleTrackProblem(values: Partial<LeetCodeEntry>) {
    await leetcodeApi.createEntry(toEntryBody(values));
    await onEntriesChanged();
  }

  async function handleUpdateProblem(values: Partial<LeetCodeProblem>) {
    if (!editingProblem) return;
    await leetcodeApi.updateProblem(editingProblem.id, toProblemBody(values));
    await onProblemsChanged();
  }

  async function handleDeleteProblem() {
    if (!deletingProblem) return;
    await leetcodeApi.deleteProblem(deletingProblem.id);
    await onProblemsChanged();
  }

  return (
    <div>
      <div className="problems-filters">
        <label>
          <span>Difficulty</span>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | "ALL")}
          >
            <option value="ALL">All</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Topic</span>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value as TopicTag | "ALL")}
          >
            <option value="ALL">All</option>
            {TOPIC_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      {canManageProblems && (
        <EntityFormModal
          open={addProblemOpen}
          onClose={() => onAddProblemOpenChange(false)}
          title="Add Problem"
          fields={problemFields}
          onSubmit={handleCreateProblem}
          submitLabel="Add"
        />
      )}

      <EntityFormModal
        open={trackingProblem !== null}
        onClose={() => setTrackingProblem(null)}
        title="Track Problem"
        fields={createEntryFields(problems)}
        initialValues={
          trackingProblem
            ? {
                problemId: trackingProblem.id,
                status: "UNATTEMPTED",
                hintsUsed: 0,
                videoWatched: false,
              }
            : undefined
        }
        onSubmit={handleTrackProblem}
        submitLabel="Track"
      />

      {canManageProblems && (
        <EntityFormModal
          open={editingProblem !== null}
          onClose={() => setEditingProblem(null)}
          title="Edit Problem"
          fields={problemFields}
          initialValues={
            editingProblem
              ? {
                  number: editingProblem.number,
                  name: editingProblem.name,
                  difficulty: editingProblem.difficulty,
                  topicTag: editingProblem.topicTag,
                }
              : undefined
          }
          onSubmit={handleUpdateProblem}
          submitLabel="Save"
        />
      )}

      {canManageProblems && (
        <ConfirmDialog
          open={deletingProblem !== null}
          onClose={() => setDeletingProblem(null)}
          onConfirm={handleDeleteProblem}
          title="Delete Problem"
          message={
            deletingProblem
              ? `Delete #${deletingProblem.number} ${deletingProblem.name}? This cannot be undone.`
              : ""
          }
          confirmLabel="Delete"
        />
      )}

      {filteredProblems.length === 0 ? (
        <p>No problems match these filters.</p>
      ) : (
        <table>
          <thead>
            <SortHeaders columns={columns} sort={sort} onSortChange={setSort}>
              {canManageProblems && <th></th>}
            </SortHeaders>
          </thead>
          <tbody>
            {sortedProblems.map((problem) => {
              const tracked = trackedProblemIds.has(problem.id);
              return (
                <tr key={problem.id}>
                  <td>{problem.number}</td>
                  <td>{problem.name}</td>
                  <td>
                    <span
                      className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}
                    >
                      {problem.difficulty}
                    </span>
                  </td>
                  <td>{problem.topicTag}</td>
                  <td>
                    {tracked ? (
                      <span className="tracked-badge">Tracked</span>
                    ) : (
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setTrackingProblem(problem)}
                      >
                        Track
                      </button>
                    )}
                  </td>
                  {canManageProblems && (
                    <td className="entry-actions">
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setEditingProblem(problem)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="link-button danger"
                        onClick={() => setDeletingProblem(problem)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
