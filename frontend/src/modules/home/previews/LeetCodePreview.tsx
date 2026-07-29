import { useQuery } from "@tanstack/react-query";
import { queries } from "../../../api/queries";
import { summarizeLeetCode } from "../summaries";
import { humanize } from "../labels";
import {
  PreviewFailed,
  PreviewHero,
  PreviewNote,
  PreviewRow,
  PreviewRows,
  PreviewSkeleton,
} from "../PreviewParts";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;

export function LeetCodePreview() {
  const entriesQuery = useQuery(queries.leetcodeEntries);
  const problemsQuery = useQuery(queries.leetcodeProblems);

  if (entriesQuery.isPending || problemsQuery.isPending) return <PreviewSkeleton />;
  if (entriesQuery.error || problemsQuery.error) return <PreviewFailed />;

  const summary = summarizeLeetCode(entriesQuery.data ?? [], problemsQuery.data ?? []);

  if (!summary.hasEntries) return <PreviewNote>No problems tracked yet.</PreviewNote>;

  return (
    <>
      <PreviewHero
        value={summary.solvedTotal}
        label={summary.solvedTotal === 1 ? "problem solved" : "problems solved"}
      />

      {/* The split sits with the hero rather than in a row: it is the same
          number broken down, not a separate fact. */}
      <div className="home-chips">
        {DIFFICULTIES.map((difficulty) => (
          <span key={difficulty} className={`home-chip is-${difficulty.toLowerCase()}`}>
            {humanize(difficulty)} {summary.solvedByDifficulty[difficulty]}
          </span>
        ))}
      </div>

      <PreviewRows>
        <PreviewRow
          label="Last 7 days"
          value={summary.recentCount === 0 ? "Nothing logged" : `${summary.recentCount} entries`}
        />
        {summary.recent.map((entry) => (
          <PreviewRow key={entry.id} label={entry.label} value={humanize(entry.status)} />
        ))}
      </PreviewRows>
    </>
  );
}
