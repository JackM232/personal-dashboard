import { useQuery } from "@tanstack/react-query";
import { queries } from "../../../api/queries";
import { summarizeApplications } from "../summaries";
import { formatScheduled } from "../labels";
import {
  PreviewFailed,
  PreviewHero,
  PreviewNote,
  PreviewRow,
  PreviewRows,
  PreviewSkeleton,
} from "../PreviewParts";

export function ApplicationsPreview() {
  const applicationsQuery = useQuery(queries.applications);
  const interviewsQuery = useQuery(queries.interviews);

  if (applicationsQuery.isPending || interviewsQuery.isPending) return <PreviewSkeleton />;
  if (applicationsQuery.error || interviewsQuery.error) return <PreviewFailed />;

  const summary = summarizeApplications(applicationsQuery.data ?? [], interviewsQuery.data ?? []);

  if (summary.total === 0) return <PreviewNote>No applications tracked yet.</PreviewNote>;

  const next = summary.nextInterview;

  return (
    <>
      <PreviewHero
        value={summary.active}
        label={summary.active === 1 ? "application still open" : "applications still open"}
      />

      <PreviewRows>
        <PreviewRow
          label="Applied"
          value={summary.counts.APPLIED + summary.counts.ONLINE_ASSESSMENT}
        />
        <PreviewRow label="Interviewing" value={summary.counts.INTERVIEWING} />
        <PreviewRow label="Offers" value={summary.counts.OFFER} />
        <PreviewRow
          label="Next interview"
          value={
            next
              ? `${next.application?.company ?? "Interview"} · ${formatScheduled(next.scheduledAt)}`
              : "None scheduled"
          }
        />
      </PreviewRows>
    </>
  );
}
