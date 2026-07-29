import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../api/queryKeys";
import { queries } from "../../api/queries";
import type { LeetCodeEntry, LeetCodeProblem } from "./types";
import { useAuth } from "../../auth/useAuth";
import { CONTRIBUTOR_ROLES, hasRole } from "../../auth/roles";
import { EntriesTab } from "./EntriesTab";
import { ProblemsTab } from "./ProblemsTab";
import "./LeetCodePage.css";

type Tab = "entries" | "problems";

export function LeetCodePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("entries");
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  const [addProblemOpen, setAddProblemOpen] = useState(false);
  const queryClient = useQueryClient();

  const entriesQuery = useQuery(queries.leetcodeEntries);
  const problemsQuery = useQuery(queries.leetcodeProblems);

  const canManageProblems = hasRole(user, ...CONTRIBUTOR_ROLES);

  // The tabs call these after a mutation; a refetch replaces the cached list.
  function loadEntries() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.leetcode.entries });
  }

  function loadProblems() {
    return queryClient.invalidateQueries({ queryKey: queryKeys.leetcode.problems });
  }

  const entries: LeetCodeEntry[] = entriesQuery.data ?? [];
  const problems: LeetCodeProblem[] = problemsQuery.data ?? [];
  const error = entriesQuery.error ?? problemsQuery.error;

  // isPending is true only until the first successful fetch — on a return visit
  // the cached lists render immediately while the refetch runs behind them.
  if (entriesQuery.isPending || problemsQuery.isPending) return <p>Loading...</p>;
  if (error) return <p>Failed to load: {error.message}</p>;

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
