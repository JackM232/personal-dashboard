import { useQuery } from "@tanstack/react-query";
import { queries } from "../../../api/queries";
import { summarizeGym } from "../summaries";
import { formatShortDay } from "../labels";
import {
  PreviewFailed,
  PreviewHero,
  PreviewNote,
  PreviewRow,
  PreviewRows,
  PreviewSkeleton,
} from "../PreviewParts";

// Bodyweight is stored unitless — whatever the user weighs themselves in — so
// the trend carries a sign and no unit, same as the module's own chart.
function formatChange(change: number): string {
  const sign = change > 0 ? "+" : change < 0 ? "−" : "±";
  return `${sign}${Math.abs(change).toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
}

export function GymPreview() {
  const sessionsQuery = useQuery(queries.gymSessions);
  const bodyweightQuery = useQuery(queries.gymBodyweight);

  if (sessionsQuery.isPending || bodyweightQuery.isPending) return <PreviewSkeleton />;
  if (sessionsQuery.error || bodyweightQuery.error) return <PreviewFailed />;

  const summary = summarizeGym(sessionsQuery.data ?? [], bodyweightQuery.data ?? []);

  if (!summary.lastSession && !summary.latestWeight) {
    return <PreviewNote>No sessions logged yet.</PreviewNote>;
  }

  return (
    <>
      <PreviewHero
        value={summary.sessionsThisWeek}
        label={summary.sessionsThisWeek === 1 ? "session this week" : "sessions this week"}
      />

      <PreviewRows>
        <PreviewRow
          label="Last session"
          value={
            summary.lastSession
              ? `${formatShortDay(summary.lastSession.performedAt)} · ${summary.lastSessionExercises} exercise${summary.lastSessionExercises === 1 ? "" : "s"}`
              : "None yet"
          }
        />
        {summary.lastSession?.name && (
          <PreviewRow label="Split" value={summary.lastSession.name} />
        )}
        <PreviewRow
          label="Bodyweight"
          value={
            summary.latestWeight
              ? `${summary.latestWeight.weight}${summary.weightChange === null ? "" : ` (${formatChange(summary.weightChange)} / 30d)`}`
              : "No weigh-ins"
          }
        />
      </PreviewRows>
    </>
  );
}
