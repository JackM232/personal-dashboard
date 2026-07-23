import { useEffect, useState } from "react";
import { leetcodeApi } from "./api";
import type { LeetCodeEntry, LeetCodeProblem } from "./types";
import type { FieldConfig } from "../../components/EntityFormModal";
import { useAuth } from "../../auth/AuthContext";
import { EntriesTab } from "./EntriesTab";
import { ProblemsTab } from "./ProblemsTab";
import "./LeetCodePage.css";

export const problemFields: FieldConfig<LeetCodeProblem>[] = [
  { key: "number", label: "Problem #", type: "number", required: true },
  { key: "name", label: "Name", type: "text", required: true },
  {
    key: "difficulty",
    label: "Difficulty",
    type: "select",
    options: ["EASY", "MEDIUM", "HARD"],
    required: true,
  },
  {
    key: "topicTag",
    label: "Topic",
    type: "select",
    options: [
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
    ],
    required: true,
  },
];

export const CONTRIBUTOR_ROLES = ["CONTRIBUTOR", "ADMIN"];

type Tab = "entries" | "problems";

export function LeetCodePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("entries");
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [addProblemOpen, setAddProblemOpen] = useState(false);
  const [entries, setEntries] = useState<LeetCodeEntry[]>([]);
  const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManageProblems = user ? CONTRIBUTOR_ROLES.includes(user.role) : false;

  function loadEntries() {
    return leetcodeApi.listEntries().then(setEntries);
  }

  function loadProblems() {
    return leetcodeApi.listProblems().then(setProblems);
  }

  useEffect(() => {
    Promise.all([loadEntries(), loadProblems()])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error}</p>;

  return (
    <div>
      <div className="leetcode-header">
        <h1>LeetCode</h1>
      </div>

      <div className="leetcode-tabs">
        <div className="leetcode-tabs-list">
          <button
            type="button"
            className={`leetcode-tab ${tab === "entries" ? "active" : ""}`}
            onClick={() => setTab("entries")}
          >
            My Entries
          </button>
          <button
            type="button"
            className={`leetcode-tab ${tab === "problems" ? "active" : ""}`}
            onClick={() => setTab("problems")}
          >
            Browse Problems
          </button>
        </div>

        {tab === "entries" && (
          <button type="button" className="add-button" onClick={() => setAddEntryOpen(true)}>
            Add Entry
          </button>
        )}

        {tab === "problems" && canManageProblems && (
          <button
            type="button"
            className="add-button secondary"
            onClick={() => setAddProblemOpen(true)}
          >
            Add Problem
          </button>
        )}
      </div>

      {tab === "entries" ? (
        <EntriesTab
          problems={problems}
          entries={entries}
          onEntriesChanged={loadEntries}
          addEntryOpen={addEntryOpen}
          onAddEntryOpenChange={setAddEntryOpen}
        />
      ) : (
        <ProblemsTab
          problems={problems}
          entries={entries}
          canManageProblems={canManageProblems}
          onProblemsChanged={loadProblems}
          onEntriesChanged={loadEntries}
          addProblemOpen={addProblemOpen}
          onAddProblemOpenChange={setAddProblemOpen}
        />
      )}
    </div>
  );
}
